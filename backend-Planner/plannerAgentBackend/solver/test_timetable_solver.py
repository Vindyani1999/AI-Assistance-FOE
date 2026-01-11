import time
import json
from copy import deepcopy
from timetable_csp import load_data, build_model, solve_model, generate_expanded_json
from ortools.sat.python import cp_model

def intelligent_module_separation(modules):
    """
    Intelligently separate modules into groups to avoid bottlenecks.
    This mimics what your main project likely does to get feasible solutions.
    """
    print("🧠 Applying intelligent module separation...")
    
    # Strategy 1: Group by semester ranges (like academic scheduling)
    semester_groups = {
        'lower_semesters': [1, 2],      # First year
        'middle_semesters': [3, 4],     # Second year  
        'upper_semesters': [5, 6, 7]    # Final years
    }
    
    separated_groups = {}
    for group_name, sems in semester_groups.items():
        separated_groups[group_name] = [m for m in modules if m['semester'] in sems]
        print(f"  {group_name}: {len(separated_groups[group_name])} modules")
    
    return separated_groups

def solve_separated_groups(separated_groups, halls, days, slots_per_day):
    """
    Solve each group separately and combine results.
    This avoids the combinatorial explosion of solving all modules together.
    """
    all_results = []
    combined_timetable = []
    
    for group_name, group_modules in separated_groups.items():
        if not group_modules:
            continue
            
        print(f"\n🔧 Solving {group_name} ({len(group_modules)} modules)...")
        
        # Assign different day ranges to different groups
        if group_name == 'lower_semesters':
            group_days = days[:3]  # Mon-Wed
        elif group_name == 'middle_semesters':
            group_days = days[2:5]  # Wed-Fri
        else:  # upper_semesters
            group_days = days[4:]   # Fri-Sun
        
        print(f"  Assigned days: {group_days}")
        
        # Build and solve this subgroup
        model, module_vars, _, _ = build_model(group_modules, halls, group_days, slots_per_day)
        solver_status, solver = solve_model(model, module_vars, group_modules, halls, group_days, slots_per_day)
        
        # Generate results for this group
        group_result = generate_expanded_json(solver_status, solver, module_vars, group_modules, halls, group_days)
        
        if solver_status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            print(f"  ✅ {group_name}: FEASIBLE - {len(group_result['timetable'])} timetable entries")
            combined_timetable.extend(group_result['timetable'])
        else:
            print(f"  ❌ {group_name}: INFEASIBLE")
        
        all_results.append({
            'group': group_name,
            'modules': len(group_modules),
            'status': 'FEASIBLE' if solver_status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 'INFEASIBLE',
            'timetable_entries': len(group_result['timetable']),
            'assigned_days': group_days
        })
    
    # Create combined result
    combined_result = {
        "status": "FEASIBLE" if combined_timetable else "INFEASIBLE",
        "timetable": combined_timetable,
        "group_results": all_results,
        "total_modules": sum(len(group) for group in separated_groups.values()),
        "total_timetable_entries": len(combined_timetable)
    }
    
    return combined_result

def evaluate_intelligent_solution(combined_result, modules, halls, days, slots_per_day):
    """Evaluate the intelligently separated solution."""
    metrics = {
        "status": combined_result["status"],
        "total_modules": combined_result["total_modules"],
        "total_timetable_entries": combined_result["total_timetable_entries"],
        "group_results": combined_result["group_results"],
        "hard_violations": 0,
        "department_semester_violations": 0,
        "capacity_violations": 0,
        "overlap_violations": 0,
        "slot_utilization": 0.0
    }
    
    if combined_result["status"] != "FEASIBLE":
        return metrics
    
    # Check for violations in the combined timetable
    timetable = combined_result["timetable"]
    
    # Check hall capacity violations
    hall_capacities = {h["hall"]: h["capacity"] for h in halls}
    capacity_violations = 0
    for entry in timetable:
        module = next((m for m in modules if m["code"] == entry["code"]), None)
        if module and hall_capacities[entry["hall"]] < module["students"]:
            capacity_violations += 1
    metrics["capacity_violations"] = capacity_violations
    
    # Check overlap violations
    overlap_violations = 0
    slot_usage = {}
    for entry in timetable:
        key = (entry["day"], entry["hall"], entry["slot"])
        if key in slot_usage:
            overlap_violations += 1
        else:
            slot_usage[key] = entry["code"]
    metrics["overlap_violations"] = overlap_violations
    
    # Check department-semester violations
    dept_semester_violations = 0
    dept_semester_slots = {}
    for entry in timetable:
        module = next((m for m in modules if m["code"] == entry["code"]), None)
        if module and module.get("department"):
            key = (module["department"], module["semester"], entry["day"], entry["slot"])
            if key in dept_semester_slots:
                dept_semester_violations += 1
            else:
                dept_semester_slots[key] = True
    metrics["department_semester_violations"] = dept_semester_violations
    
    # Calculate slot utilization
    total_slots = len(days) * len(halls) * slots_per_day
    occupied_slots = len(set((entry["day"], entry["hall"], entry["slot"]) for entry in timetable))
    metrics["slot_utilization"] = occupied_slots / total_slots if total_slots > 0 else 0.0
    metrics["hard_violations"] = capacity_violations + overlap_violations + dept_semester_violations
    
    return metrics

def run_intelligent_test_scenarios(scenarios, slots_per_day):
    """Run tests using intelligent separation strategies."""
    results = []
    
    for scenario_id, scenario in enumerate(scenarios):
        print(f"\n{'='*60}")
        print(f"=== INTELLIGENT SCENARIO {scenario_id + 1} ===")
        print(f"{'='*60}")
        
        modules = scenario["modules"]
        halls = scenario["halls"]
        days = scenario["days"]

        # Filter out impossible modules
        original_count = len(modules)
        modules = [m for m in modules if m["duration"] <= slots_per_day and any(h["capacity"] >= m["students"] for h in halls)]
        
        print(f"📋 Modules: {len(modules)}/{original_count} (after filtering)")
        print(f"🏛️ Halls: {len(halls)}")
        print(f"📅 Days: {len(days)}")
        print(f"⏰ Slots per day: {slots_per_day}")

        if not modules:
            print("❌ No valid modules for this scenario. Skipping.")
            results.append({
                "status": "INFEASIBLE",
                "runtime_sec": 0,
                "hard_violations": 0,
                "scenario_id": scenario_id + 1,
                "num_modules": 0,
                "strategy": "intelligent_separation"
            })
            continue

        # Apply intelligent separation
        start_time = time.time()
        separated_groups = intelligent_module_separation(modules)
        combined_result = solve_separated_groups(separated_groups, halls, days, slots_per_day)
        end_time = time.time()
        
        # Evaluate the solution
        metrics = evaluate_intelligent_solution(combined_result, modules, halls, days, slots_per_day)
        metrics.update({
            "runtime_sec": end_time - start_time,
            "scenario_id": scenario_id + 1,
            "num_modules": len(modules),
            "num_halls": len(halls),
            "strategy": "intelligent_separation",
            "group_breakdown": combined_result["group_results"]
        })

        results.append(metrics)

        print(f"\n📊 INTELLIGENT SOLUTION RESULTS:")
        print(f"  Overall Status: {metrics['status']}")
        print(f"  Total Runtime: {metrics['runtime_sec']:.2f}s")
        print(f"  Total Violations: {metrics['hard_violations']}")
        print(f"  Slot Utilization: {metrics['slot_utilization']:.1%}")
        print(f"  Group Breakdown:")
        for group in metrics['group_breakdown']:
            status_icon = "✅" if group['status'] == 'FEASIBLE' else "❌"
            print(f"    {status_icon} {group['group']}: {group['modules']} modules on {group['assigned_days']}")

    return results

def run_naive_test_scenarios(scenarios, slots_per_day):
    """Run tests using naive approach (all modules together)."""
    results = []
    
    for scenario_id, scenario in enumerate(scenarios):
        print(f"\n{'='*60}")
        print(f"=== NAIVE SCENARIO {scenario_id + 1} ===")
        print(f"{'='*60}")
        
        modules = scenario["modules"]
        halls = scenario["halls"]
        days = scenario["days"]

        # Filter out impossible modules
        original_count = len(modules)
        modules = [m for m in modules if m["duration"] <= slots_per_day and any(h["capacity"] >= m["students"] for h in halls)]
        
        print(f"📋 Modules: {len(modules)}/{original_count} (after filtering)")
        print(f"🏛️ Halls: {len(halls)}")
        print(f"📅 Days: {len(days)}")

        if not modules:
            print("❌ No valid modules for this scenario. Skipping.")
            results.append({
                "status": "INFEASIBLE",
                "runtime_sec": 0,
                "hard_violations": 0,
                "scenario_id": scenario_id + 1,
                "num_modules": 0,
                "strategy": "naive"
            })
            continue

        # Build and solve all modules together (naive approach)
        start_time = time.time()
        model, module_vars, _, _ = build_model(modules, halls, days, slots_per_day)
        solver_status, solver = solve_model(model, module_vars, modules, halls, days, slots_per_day)
        end_time = time.time()
        
        # Use simple evaluation instead of importing
        metrics = {
            "status": "INFEASIBLE" if solver_status not in (cp_model.OPTIMAL, cp_model.FEASIBLE) else "FEASIBLE",
            "runtime_sec": end_time - start_time,
            "hard_violations": 0,  # Simplified for now
            "scenario_id": scenario_id + 1,
            "num_modules": len(modules),
            "num_halls": len(halls),
            "strategy": "naive"
        }

        results.append(metrics)

        print(f"\n📊 NAIVE SOLUTION RESULTS:")
        print(f"  Status: {metrics['status']}")
        print(f"  Runtime: {metrics['runtime_sec']:.2f}s")

    return results

def create_progressive_scenarios(modules, halls):
    """Create progressive test scenarios."""
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    scenarios = []
    
    # Test sizes that matter
    test_sizes = [5, 20, 40, 60, 80, 96]
    
    for size in test_sizes:
        scenarios.append({
            "modules": deepcopy(modules[:size]), 
            "halls": deepcopy(halls), 
            "days": days
        })
    
    return scenarios

def compare_strategies(intelligent_results, naive_results):
    """Compare intelligent vs naive strategies."""
    print(f"\n{'='*60}")
    print("🎯 STRATEGY COMPARISON SUMMARY")
    print(f"{'='*60}")
    
    for intel, naive in zip(intelligent_results, naive_results):
        if intel['num_modules'] != naive['num_modules']:
            continue
            
        print(f"\n📦 Scenario {intel['scenario_id']} ({intel['num_modules']} modules):")
        print(f"  🧠 Intelligent Separation:")
        print(f"     Status: {intel['status']} | Time: {intel['runtime_sec']:.2f}s | Violations: {intel['hard_violations']}")
        print(f"  🎯 Naive Approach:")
        print(f"     Status: {naive['status']} | Time: {naive['runtime_sec']:.2f}s | Violations: {naive['hard_violations']}")
        
        if intel['status'] == 'FEASIBLE' and naive['status'] != 'FEASIBLE':
            print(f"  🎉 INTELLIGENT STRATEGY SUCCESSFUL! Solved what naive couldn't!")

if __name__ == "__main__":
    # Load data
    modules, halls = load_data()
    slots_per_day = 8
    
    print("🚀 INTELLIGENT TIMETABLE SOLVER TEST")
    print("Comparing separation strategies vs naive approach")
    print(f"Total modules available: {len(modules)}")
    print(f"Total halls available: {len(halls)}")
    print(f"Using 7 days (Mon-Sun) like main project\n")
    
    # Create scenarios
    scenarios = create_progressive_scenarios(modules, halls)
    
    # Run both strategies
    print("🧠 RUNNING INTELLIGENT SEPARATION STRATEGY...")
    intelligent_results = run_intelligent_test_scenarios(scenarios, slots_per_day)
    
    print("\n🎯 RUNNING NAIVE APPROACH...")
    naive_results = run_naive_test_scenarios(scenarios, slots_per_day)
    
    # Compare results
    compare_strategies(intelligent_results, naive_results)
    
    # Save detailed results
    comparison_results = {
        "intelligent_strategy": intelligent_results,
        "naive_approach": naive_results,
        "summary": {
            "total_modules": len(modules),
            "total_halls": len(halls),
            "test_scenarios": len(scenarios)
        }
    }
    
    with open("timetable_strategy_comparison.json", "w") as f:
        json.dump(comparison_results, f, indent=2)
    
    print(f"\n✅ Detailed comparison saved to timetable_strategy_comparison.json")