import pandas as pd
from ortools.sat.python import cp_model
import json

# ----------------------------
# 1. LOAD DATA
# ----------------------------
def load_data():
    file_path = "../data/planner_agent_data_nushan.xlsx"
    modules_df = pd.read_excel(file_path, sheet_name="module codes")
    halls_df = pd.read_excel(file_path, sheet_name="halls-exam")

    modules_df = modules_df.dropna(subset=["module_code", "no_of_students"])
    modules_df["iscommon"] = modules_df.get("iscommon", False).fillna(False).astype(bool)
    modules_df["no_of_students"] = modules_df["no_of_students"].astype(int)

    modules = []
    for _, row in modules_df.iterrows():
        modules.append({
            "code": str(row["module_code"]),
            "semester": int(row["semester"]) if "semester" in row and pd.notna(row["semester"]) else None,
            "iscommon": bool(row.get("iscommon", False)),
            "department": row.get("department", None),
            "students": int(row["no_of_students"]),
            "name": row.get("name", None),
        })

    # Sort halls by capacity descending (important for fill-order logic)
    halls = []
    for _, row in halls_df.iterrows():
        halls.append({
            "hall": str(row["room_name"]),
            "capacity": int(row["capacity"]),
        })
    halls = sorted(halls, key=lambda x: x["capacity"], reverse=True)

    return modules, halls

# ----------------------------
# 2. BUILD EXAM MODEL
# ----------------------------
def build_exam_model(modules, halls, days, slots_per_day):
    model = cp_model.CpModel()

    num_days = len(days)
    num_slots = slots_per_day
    num_halls = len(halls)

    # Int vars per module for day and slot
    module_vars = {}
    for m in modules:
        code = m["code"]
        dvar = model.NewIntVar(0, num_days - 1, f"day_{code}")
        svar = model.NewIntVar(0, num_slots - 1, f"slot_{code}")
        module_vars[code] = {"day": dvar, "slot": svar}

    # presence[(code,d,s,h)] == True iff module code uses hall h at day d, slot s
    presence = {}
    for m in modules:
        code = m["code"]
        for d in range(num_days):
            for s in range(num_slots):
                for h in range(num_halls):
                    p = model.NewBoolVar(f"pres_{code}_d{d}_s{s}_h{h}")
                    presence[(code, d, s, h)] = p
                    # If presence then day/slot equal
                    model.Add(module_vars[code]["day"] == d).OnlyEnforceIf(p)
                    model.Add(module_vars[code]["slot"] == s).OnlyEnforceIf(p)

    # assign_ds[(code,d,s)] == True iff module scheduled at day d & slot s (in >=1 hall)
    assign_ds = {}
    for m in modules:
        code = m["code"]
        for d in range(num_days):
            for s in range(num_slots):
                a = model.NewBoolVar(f"assign_{code}_d{d}_s{s}")
                assign_ds[(code, d, s)] = a
                pres_over_halls = [presence[(code, d, s, h)] for h in range(num_halls)]
                # presence -> assign_ds
                for ph in pres_over_halls:
                    model.AddImplication(ph, a)
                # assign_ds -> at least one presence
                model.Add(sum(pres_over_halls) >= 1).OnlyEnforceIf(a)
                # if not assigned then no presences
                for ph in pres_over_halls:
                    model.Add(ph == 0).OnlyEnforceIf(a.Not())

    # Exactly one (day,slot) per module
    for m in modules:
        code = m["code"]
        a_list = [assign_ds[(code, d, s)] for d in range(num_days) for s in range(num_slots)]
        model.AddExactlyOne(a_list)
        # Link assign_ds -> module_vars day/slot
        for d in range(num_days):
            for s in range(num_slots):
                model.Add(module_vars[code]["day"] == d).OnlyEnforceIf(assign_ds[(code, d, s)])
                model.Add(module_vars[code]["slot"] == s).OnlyEnforceIf(assign_ds[(code, d, s)])

    # Hall capacity coverage: when a module is assigned at (d,s),
    # sum(capacity[h] * presence) >= students  (HARD constraint)
    for m in modules:
        code = m["code"]
        students = m["students"]
        for d in range(num_days):
            for s in range(num_slots):
                pres_over_halls = [presence[(code, d, s, h)] for h in range(num_halls)]
                coeffs = [halls[h]["capacity"] for h in range(num_halls)]
                # create linear expression
                model.Add(
                    sum(coeffs[h] * pres_over_halls[h] for h in range(num_halls)) >= students
                ).OnlyEnforceIf(assign_ds[(code, d, s)])

    # At most one exam per hall per (day, slot) (HARD)
    # for d in range(num_days):
    #     for s in range(num_slots):
    #         for h_idx in range(num_halls):
    #             pres_list = [presence[(m["code"], d, s, h_idx)] for m in modules]
    #             model.Add(sum(pres_list) <= 1)

    # Enforce fill-order: sort halls by capacity descending.
    # If a module uses hall k (0-based in sorted list), it implies that total capacity of previous halls
    # is insufficient to hold all students (i.e. students > cumulative_capacity(prev halls)).
    # This forces solver to fill large halls first.
    cum_caps = []
    running = 0
    for h in halls:
        cum_caps.append(running)
        running += h["capacity"]
    # cum_caps[h] is sum of capacities of halls with index < h
    for m in modules:
        students = m["students"]
        code = m["code"]
        for d in range(num_days):
            for s in range(num_slots):
                for h_idx in range(num_halls):
                    # If presence[(code,d,s,h_idx)] then students >= cum_caps[h_idx] + 1
                    # (i.e., students > cum_caps[h_idx])
                    # Only apply when assigned to that (d,s)
                    p = presence[(code, d, s, h_idx)]
                    # Use >= because CP-SAT doesn't support strict >
                    model.Add(students >= (cum_caps[h_idx] + 1)).OnlyEnforceIf(p)

    # Hall used per module: hall_used[(code,h)] = OR over all (d,s) presence[(code,d,s,h)]
    hall_used = {}
    for m in modules:
        code = m["code"]
        for h in range(num_halls):
            hu = model.NewBoolVar(f"hall_used_{code}_h{h}")
            hall_used[(code, h)] = hu
            # presence -> hall_used
            pres_all = [presence[(code, d, s, h)] for d in range(num_days) for s in range(num_slots)]
            for p in pres_all:
                model.AddImplication(p, hu)
            # hall_used -> at least one presence
            model.Add(sum(pres_all) >= 1).OnlyEnforceIf(hu)
            # if not used then no presences
            for p in pres_all:
                model.Add(p == 0).OnlyEnforceIf(hu.Not())

    # Soft: minimize same-department overlaps (existing)
    overlap_vars = []
    dept_map = {}
    for m in modules:
        dept = m.get("department")
        if pd.isna(dept) or dept is None:
            continue
        dept_map.setdefault(dept, []).append(m)

    for dept, mod_list in dept_map.items():
        n = len(mod_list)
        for i in range(n):
            for j in range(i + 1, n):
                mi = mod_list[i]["code"]
                mj = mod_list[j]["code"]
                for d in range(num_days):
                    for s in range(num_slots):
                        ov = model.NewBoolVar(f"ov_{dept}_{mi}_{mj}_d{d}_s{s}")
                        overlap_vars.append(ov)
                        dpi = assign_ds[(mi, d, s)]
                        dpj = assign_ds[(mj, d, s)]
                        model.AddImplication(ov, dpi)
                        model.AddImplication(ov, dpj)
                        # ov <= dpi and ov <= dpj already ensured by implications
                        # Ensure ov = 1 only when both are assigned: (dpi.Not() or dpj.Not() or ov)
                        model.AddBoolOr([dpi.Not(), dpj.Not(), ov])

    # Soft: minimize number of halls used per module (prefer fewer halls)
    # We'll collect all hall_used vars and count them in objective (small weight).
    hall_used_vars = [hall_used[(m["code"], h)] for m in modules for h in range(num_halls)]

    # Soft: pack same-semester modules into same hall when they share (d,s)
    # For each same-semester pair (mi,mj), day d, slot s:
    # - both_assigned = assign_ds[mi,d,s] AND assign_ds[mj,d,s]
    # - for each hall h create both_in_h = presence[mi,d,s,h] AND presence[mj,d,s,h]
    # - share_any = OR_h both_in_h
    # - penalize_pair = both_assigned AND (NOT share_any)
    semester_pair_penalties = []
    # Build semester map
    sem_map = {}
    for m in modules:
        sem = m.get("semester")
        if sem is not None:
            sem_map.setdefault(sem, []).append(m)
    for sem, mod_list in sem_map.items():
        n = len(mod_list)
        for i in range(n):
            for j in range(i + 1, n):
                mi = mod_list[i]["code"]
                mj = mod_list[j]["code"]
                for d in range(num_days):
                    for s in range(num_slots):
                        both_assigned = model.NewBoolVar(f"both_assigned_{mi}_{mj}_d{d}_s{s}")
                        # both_assigned -> both assign_ds true
                        model.AddBoolAnd([assign_ds[(mi, d, s)], assign_ds[(mj, d, s)]]).OnlyEnforceIf(both_assigned)
                        # If not both_assigned then at least one is false
                        model.AddBoolOr([assign_ds[(mi, d, s)].Not(), assign_ds[(mj, d, s)].Not(), both_assigned])

                        # both_in_h list
                        both_in_h_vars = []
                        for h in range(num_halls):
                            both_in_h = model.NewBoolVar(f"both_in_h_{mi}_{mj}_d{d}_s{s}_h{h}")
                            both_in_h_vars.append(both_in_h)
                            # both_in_h ↔ (presence[mi,d,s,h] AND presence[mj,d,s,h])
                            model.AddBoolAnd([presence[(mi, d, s, h)], presence[(mj, d, s, h)]]).OnlyEnforceIf(both_in_h)
                            model.AddBoolOr([presence[(mi, d, s, h)].Not(), presence[(mj, d, s, h)].Not(), both_in_h])

                        # share_any var
                        share_any = model.NewBoolVar(f"share_any_{mi}_{mj}_d{d}_s{s}")
                        model.AddBoolOr(both_in_h_vars).OnlyEnforceIf(share_any)
                        # reverse: any both_in_h -> share_any
                        for b in both_in_h_vars:
                            model.AddImplication(b, share_any)

                        # penalize_pair = both_assigned AND (NOT share_any)
                        penal = model.NewBoolVar(f"penal_sem_{mi}_{mj}_d{d}_s{s}")
                        semester_pair_penalties.append(penal)
                        # If penal -> both_assigned
                        model.AddImplication(penal, both_assigned)
                        # If penal -> not share_any
                        model.AddImplication(penal, share_any.Not())
                        # If both_assigned and not share_any then penal must be true:
                        model.AddBoolOr([both_assigned.Not(), share_any, penal])

    # Build final objective:
    # - Primary: minimize department overlaps (overlap_vars)
    # - Secondary: minimize semester pair penalties (semester_pair_penalties)
    # - Tertiary: minimize number of halls used (hall_used_vars)
    # We'll combine them with weights so solver prefers reducing dept overlaps first.
    dept_overlap_weight = 10000
    sem_penalty_weight = 100
    hall_used_weight = 1

    objective_terms = []
    if overlap_vars:
        objective_terms.append((dept_overlap_weight, overlap_vars))
    if semester_pair_penalties:
        objective_terms.append((sem_penalty_weight, semester_pair_penalties))
    if hall_used_vars:
        objective_terms.append((hall_used_weight, hall_used_vars))

    # Create linear objective: weighted sum
    linear_terms = []
    for w, varlist in objective_terms:
        for v in varlist:
            linear_terms.append((w, v))
    if linear_terms:
        model.Minimize(sum(w * v for w, v in linear_terms))

    return model, module_vars, presence, assign_ds, hall_used

# ----------------------------
# JSON generation / distribution
# ----------------------------
def generate_exam_json(status, solver, module_vars, modules, halls, days, presence, assign_ds):
    result = {
        "status": "INFEASIBLE" if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE) else ("OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE"),
        "timetable": []
    }

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return result

    # For each module, read assigned (d,s) and which halls were selected
    for m in modules:
        code = m["code"]
        d = solver.Value(module_vars[code]["day"])
        s = solver.Value(module_vars[code]["slot"])

        # collect halls used for this module at (d,s)
        hall_list = []
        for h_idx in range(len(halls)):
            if solver.Value(presence[(code, d, s, h_idx)]) == 1:
                hall_list.append(halls[h_idx])

        total_students = m["students"]
        distributed_students = []
        # Distribute students filling halls in order (largest-first) until students exhausted
        if hall_list:
            remaining = total_students
            for i, h in enumerate(hall_list):
                if i < len(hall_list) - 1:
                    # allocate as much as possible to this hall: either full hall or remaining students
                    allocated = min(remaining, h["capacity"])
                    remaining -= allocated
                else:
                    # last hall receives all remaining
                    allocated = remaining
                    remaining = 0
                distributed_students.append(f"{h['hall']}-{allocated}")
            # sanity: if for some reason remaining > 0, append into last hall (shouldn't happen)
            if remaining > 0:
                last = distributed_students.pop() if distributed_students else None
                if last:
                    name, num = last.rsplit("-", 1)
                    distributed_students.append(f"{name}-{int(num)+remaining}")

        entry = {
            "code": code,
            "day": days[d],
            "slot": int(s),
            "halls": distributed_students,
            "students": total_students,
            "department": m.get("department"),
            "semester": m.get("semester"),
            "iscommon": m.get("iscommon", False),
            "name": m.get("name")
        }
        result["timetable"].append(entry)

    return result

# ----------------------------
# Solve
# ----------------------------
def solve_model(model, time_limit_seconds=60, workers=8):
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.num_search_workers = workers
    # optional: more aggressive presolve / search parameters can be tuned here
    status = solver.Solve(model)
    return status, solver

# ----------------------------
# Main
# ----------------------------
def main():
    # 2 weeks (14 days)
    days = ["day1", "day2", "day3", "day4", "day5", "day6", "day7",
            "day8", "day9", "day10", "day11", "day12", "day13", "day14"]
    slots_per_day = 2  # two exam slots per day (morning, afternoon)

    modules, halls = load_data()
    model, module_vars, presence, assign_ds, hall_used = build_exam_model(modules, halls, days, slots_per_day)

    # Solve
    status, solver = solve_model(model, time_limit_seconds=60, workers=8)

    # Produce JSON
    result_json = generate_exam_json(status, solver, module_vars, modules, halls, days, presence, assign_ds)

    print(json.dumps(result_json, indent=2))

    # Optionally print a human-friendly grid of day/slot -> list of modules (simple)
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        grid = {}
        for d_idx, d in enumerate(days):
            for s in range(slots_per_day):
                key = f"{d}_slot{s}"
                grid[key] = []
        for m in modules:
            code = m["code"]
            d = solver.Value(module_vars[code]["day"])
            s = solver.Value(module_vars[code]["slot"])
            # halls used
            halls_used = []
            for h_idx in range(len(halls)):
                if solver.Value(presence[(code, d, s, h_idx)]) == 1:
                    halls_used.append(halls[h_idx]["hall"])
            grid[f"{days[d]}_slot{s}"].append({"code": code, "halls": halls_used})
        print("\nHuman readable grid (day_slot -> modules):")
        for k, v in grid.items():
            print(f"{k}: {v}")

if __name__ == "__main__":
    main()
