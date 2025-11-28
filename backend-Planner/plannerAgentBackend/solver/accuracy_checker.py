import json
from collections import defaultdict

timetable_json = {"status": "OPTIMAL", "timetable": [{"code": "CE1202", "day": "day2", "slot": 0, "halls": ["Mechanical-New Workshop-550"], "students": 550, "department": "CE", "semester": 1, "iscommon": True, "name": "Introduction to Infrastructure Planning"}, {"code": "CE1101", "day": "day6", "slot": 0, "halls": ["Mechanical-New Workshop-550"], "students": 550, "department": "CE", "semester": 1, "iscommon": True, "name": "Basic Concepts in Environmental Engineering"}, {"code": "EE1301", "day": "day10", "slot": 0, "halls": ["LR1-550"], "students": 550, "department": "EE", "semester": 1, "iscommon": True, "name": "Fundamentals of Electricity"}, {"code": "EE1101", "day": "day5", "slot": 0, "halls": ["ELTU2-550"], "students": 550, "department": "EE", "semester": 1, "iscommon": True, "name": "Computer Programming I"}, {"code": "ME1201", "day": "day13", "slot": 1, "halls": ["LR1-550"], "students": 550, "department": "ME", "semester": 1, "iscommon": True, "name": "Engineering Drawing"}, {"code": "ME1202", "day": "day7", "slot": 1, "halls": ["LR1-550"], "students": 550, "department": "ME", "semester": 1, "iscommon": True, "name": "Fundamentals of Thermodynamics"}, {"code": "IS1402", "day": "day13", "slot": 0, "halls": ["ELTU2-550"], "students": 550, "department": "IS", "semester": 1, "iscommon": True, "name": "Mathematical Fundamentals for Engineers"}, {"code": "IS1301", "day": "day13", "slot": 1, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 1, "iscommon": True, "name": "Communication for Engineers"}, {"code": "IS1003", "day": "day12", "slot": 0, "halls": ["LT1-550"], "students": 550, "department": "IS", "semester": 1, "iscommon": True, "name": "Proficiency in English"}, {"code": "CE3201", "day": "day5", "slot": 1, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 3, "iscommon": False, "name": "Concrete Technology"}, {"code": "CE3202", "day": "day10", "slot": 1, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 3, "iscommon": False, "name": "Construction Processes and Technology"}, {"code": "CE3303", "day": "day6", "slot": 1, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 3, "iscommon": False, "name": "Engineering Surveying"}, {"code": "CE3304", "day": "day7", "slot": 0, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 3, "iscommon": False, "name": "Concrete Technology"}, {"code": "CE3205", "day": "day10", "slot": 0, "halls": ["ELTU2-100"], "students": 100, "department": "CE", "semester": 3, "iscommon": False, "name": "Concrete Technology"}, {"code": "EE3301", "day": "day2", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 3, "iscommon": False, "name": "Analog Electronics"}, {"code": "EE3202", "day": "day6", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 3, "iscommon": False, "name": "Data Structures and Algorithms"}, {"code": "EE3203", "day": "day11", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 3, "iscommon": False, "name": "Electrical and Electronic Measurements"}, {"code": "EE3304", "day": "day12", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 3, "iscommon": False, "name": "Engineering Electromagnetism"}, {"code": "EE3205", "day": "day13", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 3, "iscommon": False, "name": "Power and Energy"}, {"code": "EE3306", "day": "day3", "slot": 0, "halls": ["ELTU1-75"], "students": 75, "department": "EE", "semester": 3, "iscommon": False, "name": "Signals and Systems"}, {"code": "EC3301", "day": "day10", "slot": 1, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 3, "iscommon": False, "name": "Analog Electronics"}, {"code": "EC3202", "day": "day8", "slot": 1, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 3, "iscommon": False, "name": "Data Structures and Algorithms"}, {"code": "EC3203", "day": "day11", "slot": 1, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 3, "iscommon": False, "name": "Electrical and Electronic Measurements"}, {"code": "EC3404", "day": "day12", "slot": 0, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 3, "iscommon": False, "name": "GUI Programming"}, {"code": "EC3305", "day": "day12", "slot": 1, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 3, "iscommon": False, "name": "Signals and Systems"}, {"code": "ME3301", "day": "day7", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 3, "iscommon": False, "name": "Applied Thermodynamics"}, {"code": "ME3202", "day": "day5", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 3, "iscommon": False, "name": "Engineering Design Methodology"}, {"code": "ME3303", "day": "day3", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 3, "iscommon": False, "name": "Fluid Mechanics"}, {"code": "ME3204", "day": "day8", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 3, "iscommon": False, "name": "Manufacturing Processes and Practice"}, {"code": "ME3305", "day": "day8", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 3, "iscommon": False, "name": "Metallurgy for Engineers"}, {"code": "ME3206", "day": "day9", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 3, "iscommon": False, "name": "Strength of Materials"}, {"code": "ME3210", "day": "day9", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 3, "iscommon": False, "name": "Principles and Applications of Microcontrollers (TE)"}, {"code": "IS3321", "day": "day11", "slot": 1, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 3, "iscommon": True, "name": "Fundamentals of Management for Engineers"}, {"code": "IS3301", "day": "day12", "slot": 1, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 3, "iscommon": True, "name": "Complex Analysis and Mathematical Transforms"}, {"code": "IS3322", "day": "day3", "slot": 0, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 3, "iscommon": True, "name": "Society and the Engineers"}, {"code": "CE5301", "day": "day11", "slot": 1, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 5, "iscommon": False, "name": "Construction Process and Technology"}, {"code": "CE5202", "day": "day11", "slot": 0, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 5, "iscommon": False, "name": "Design of Steel Structures"}, {"code": "CE5303", "day": "day12", "slot": 1, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 5, "iscommon": False, "name": "Hydraulic Engineering"}, {"code": "CE5204", "day": "day12", "slot": 0, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 5, "iscommon": False, "name": "Integrated Solid Waste Management"}, {"code": "CE5205", "day": "day13", "slot": 0, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 5, "iscommon": False, "name": "Structural Analysis III"}, {"code": "CE5306", "day": "day14", "slot": 0, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 5, "iscommon": False, "name": "Traffic and Transportation Engineering"}, {"code": "CE5251", "day": "day9", "slot": 0, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 5, "iscommon": False, "name": "Design of Timber and Masonry Structures (TE)"}, {"code": "CE5252", "day": "day13", "slot": 1, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 5, "iscommon": False, "name": "Remote Sensing and GIS(TE)"}, {"code": "EE5201", "day": "day2", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 5, "iscommon": False, "name": "Computer Architecture"}, {"code": "EE5302", "day": "day14", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 5, "iscommon": False, "name": "Computer Networks"}, {"code": "EE5303", "day": "day14", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 5, "iscommon": False, "name": "Power Electronics"}, {"code": "EE5304", "day": "day7", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 5, "iscommon": False, "name": "Power Systems II"}, {"code": "EE5305", "day": "day8", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 5, "iscommon": False, "name": "Sensors and Transducers"}, {"code": "EE5206", "day": "day10", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 5, "iscommon": False, "name": "Software Project"}, {"code": "EE5207", "day": "day11", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 5, "iscommon": False, "name": "Electronics Circuit Design (TE)"}, {"code": "EE5208", "day": "day1", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 5, "iscommon": False, "name": "Renewable Energy (TE)"}, {"code": "EE5209", "day": "day1", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 5, "iscommon": False, "name": "Web Application Development (TE)"}, {"code": "EE5453", "day": "day10", "slot": 0, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 5, "iscommon": False, "name": "Software Group Project"}, {"code": "EE5250", "day": "day14", "slot": 0, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 5, "iscommon": False, "name": "Computer Architecture and Organization"}, {"code": "EE5351", "day": "day13", "slot": 1, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 5, "iscommon": False, "name": "Control Systems Design"}, {"code": "EE5253", "day": "day2", "slot": 0, "halls": ["AUD-200"], "students": 200, "department": "EC", "semester": 5, "iscommon": False, "name": "Control Systems Design"}, {"code": "IS5311", "day": "day13", "slot": 0, "halls": ["LR1-550"], "students": 550, "department": "EC", "semester": 5, "iscommon": False, "name": "Discrete Mathematics"}, {"code": "EE5260", "day": "day7", "slot": 0, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 5, "iscommon": False, "name": "Hardware Description Language (TE)"}, {"code": "EE5261", "day": "day9", "slot": 1, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 5, "iscommon": False, "name": "Mobile Application Development (TE)"}, {"code": "EE5262", "day": "day14", "slot": 1, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 5, "iscommon": False, "name": "Object Oriented Design Patterns and Principles (TE)"}, {"code": "ME5301", "day": "day10", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 5, "iscommon": False, "name": "Advanced Control Systems"}, {"code": "ME5302", "day": "day10", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 5, "iscommon": False, "name": "Computer Aided Design"}, {"code": "ME5303", "day": "day11", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 5, "iscommon": False, "name": "Mechanical Engineering Design"}, {"code": "ME5204", "day": "day11", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 5, "iscommon": False, "name": "Production Planning and Control"}, {"code": "ME5305", "day": "day12", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 5, "iscommon": False, "name": "Refrigeration and Air \u2013 Conditioning"}, {"code": "ME5210", "day": "day12", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 5, "iscommon": False, "name": "Electric and Hybrid Vehicle Engineering (TE)"}, {"code": "ME5212", "day": "day13", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 5, "iscommon": False, "name": "Mechatronics System Design (TE)"}, {"code": "ME5213", "day": "day3", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 5, "iscommon": False, "name": "Industrial Automation (TE)"}, {"code": "IS5101", "day": "day14", "slot": 0, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 5, "iscommon": True, "name": "Engineering Ethics"}, {"code": "IS5302", "day": "day14", "slot": 1, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 5, "iscommon": True, "name": "Financial Management (GE)"}, {"code": "IS5303", "day": "day1", "slot": 1, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 5, "iscommon": True, "name": "Industrial Management (GE)"}, {"code": "IS5306", "day": "day1", "slot": 0, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 5, "iscommon": True, "name": "Numerical Methods"}, {"code": "CE8301", "day": "day14", "slot": 1, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 7, "iscommon": False, "name": "Construction Management"}, {"code": "CE7252", "day": "day3", "slot": 0, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 7, "iscommon": False, "name": "Ground Improvement Techniques (TE)"}, {"code": "CE7401", "day": "day1", "slot": 1, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 7, "iscommon": False, "name": "Comprehensive Design Project"}, {"code": "CE7606", "day": "day1", "slot": 0, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 7, "iscommon": False, "name": "Undergraduate Research Project"}, {"code": "CE7205", "day": "day2", "slot": 1, "halls": ["LR1-100"], "students": 100, "department": "CE", "semester": 7, "iscommon": False, "name": "Introduction to Research Methodology"}, {"code": "EE7208", "day": "day4", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 7, "iscommon": False, "name": "Introduction to Research"}, {"code": "EE7802", "day": "day3", "slot": 1, "halls": ["ELTU2-75"], "students": 75, "department": "EE", "semester": 7, "iscommon": False, "name": "Undergraduate Project"}, {"code": "EE8203", "day": "day8", "slot": 1, "halls": ["ELTU2-75"], "students": 75, "department": "EE", "semester": 7, "iscommon": False, "name": "Design and Management of Data Networks (TE) "}, {"code": "EE8204", "day": "day13", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 7, "iscommon": False, "name": "Digital Communication (TE) "}, {"code": "EE8206", "day": "day5", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 7, "iscommon": False, "name": "Electrical Installations II (TE)"}, {"code": "EE8208", "day": "day6", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 7, "iscommon": False, "name": "High Voltage Engineering (TE)"}, {"code": "EE8210", "day": "day9", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 7, "iscommon": False, "name": "Intelligent System Design (TE)"}, {"code": "EE8211", "day": "day4", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 7, "iscommon": False, "name": "Microwave Communications (TE)"}, {"code": "EE8217", "day": "day12", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "EE", "semester": 7, "iscommon": False, "name": "Software Architecture (TE)"}, {"code": "EC8204", "day": "day1", "slot": 1, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 7, "iscommon": False, "name": "Blockchain and Cyber Security (TE) "}, {"code": "EC8205", "day": "day1", "slot": 0, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 7, "iscommon": False, "name": "Design and Management of Data Networks (TE)"}, {"code": "EC8207", "day": "day3", "slot": 0, "halls": ["LR1-200"], "students": 200, "department": "EC", "semester": 7, "iscommon": False, "name": "IC Design (TE)"}, {"code": "ME8301", "day": "day14", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 7, "iscommon": False, "name": "Building Services Engineering"}, {"code": "ME8202", "day": "day14", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 7, "iscommon": False, "name": "Lean Manufacturing and Supply Chain Management"}, {"code": "ME8211", "day": "day1", "slot": 1, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 7, "iscommon": False, "name": "Energy Management (TE)"}, {"code": "ME8212", "day": "day1", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 7, "iscommon": False, "name": "Non Destructive Testing Applications (TE)"}, {"code": "ME7401", "day": "day2", "slot": 0, "halls": ["LR1-75"], "students": 75, "department": "ME", "semester": 7, "iscommon": False, "name": "Final Year Project (Individual)"}, {"code": "IS8201", "day": "day2", "slot": 0, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 7, "iscommon": True, "name": "English for the Professional World (GE)"}, {"code": "IS8201", "day": "day2", "slot": 0, "halls": ["LR1-550"], "students": 550, "department": "IS", "semester": 7, "iscommon": True, "name": "English for the Professional World (GE)"}]}

def load_timetable(json_data):
    """Parses the expanded JSON timetable."""
    return json_data["timetable"]


def extract_hall_name(hall_str):
    """Extract hall name from format 'HallName-StudentCount' -> 'HallName'"""
    parts = hall_str.rsplit('-', 1)
    if len(parts) == 2 and parts[1].isdigit():
        return parts[0]
    return hall_str


def check_hard_constraints(entries, modules):
    """
    Hard constraints for exam timetable:
    1. Each module scheduled exactly once
    2. No hall conflicts (same hall, same day, same slot)
    3. Students from same department + same semester cannot have overlapping exams
       (they need to attend all exams)
    """
    hard_violations = []
    
    # Build module info lookup
    module_info = {m["code"]: m for m in modules}
    
    # 1. Check each module is scheduled exactly once
    module_counts = defaultdict(int)
    for e in entries:
        module_counts[e["code"]] += 1
    
    for code, count in module_counts.items():
        if count != 1:
            hard_violations.append(f"Module {code} scheduled {count} times (should be 1)")
    
    # 2. Check hall conflicts (same hall, same day, same slot)
    hall_slot_map = defaultdict(list)
    for e in entries:
        for hall_with_count in e["halls"]:
            hall_name = extract_hall_name(hall_with_count)
            key = (hall_name, e["day"], e["slot"])
            hall_slot_map[key].append(e["code"])
    
    for (hall, day, slot), codes in hall_slot_map.items():
        if len(codes) > 1:
            hard_violations.append(
                f"Hall conflict: {hall} on {day} slot {slot} has multiple exams: {codes}"
            )
    
    # 3. Check same department + same semester conflicts
    # Group entries by (day, slot)
    day_slot_map = defaultdict(list)
    for e in entries:
        key = (e["day"], e["slot"])
        day_slot_map[key].append(e)
    
    for (day, slot), exams in day_slot_map.items():
        # Group by (department, semester) - only non-common modules
        dept_sem_map = defaultdict(list)
        for e in exams:
            if e["department"] and e["semester"] is not None:
                # For common modules, they're taken by ALL students, so we need
                # to check if any department-specific exam conflicts
                if e.get("iscommon", False):
                    # Common modules conflict with ALL same-semester dept modules
                    key = ("COMMON", e["semester"])
                else:
                    key = (e["department"], e["semester"])
                dept_sem_map[key].append(e)
        
        # Check for conflicts within same (dept, semester)
        for (dept, sem), exam_list in dept_sem_map.items():
            if dept != "COMMON" and len(exam_list) > 1:
                codes = [e["code"] for e in exam_list]
                hard_violations.append(
                    f"Dept+Sem conflict: {dept} semester {sem} on {day} slot {slot}: {codes}"
                )
        
        # Check common modules against all same-semester modules
        for (dept, sem), exam_list in dept_sem_map.items():
            if dept == "COMMON":
                # Find all same-semester non-common exams
                for (other_dept, other_sem), other_exams in dept_sem_map.items():
                    if other_dept != "COMMON" and other_sem == sem:
                        # This is a conflict - common exam overlaps with dept exam
                        common_codes = [e["code"] for e in exam_list]
                        other_codes = [e["code"] for e in other_exams]
                        hard_violations.append(
                            f"Common module conflict: {common_codes} with {other_dept} sem {sem}: {other_codes} on {day} slot {slot}"
                        )
    
    return hard_violations


def check_soft_constraints(entries):
    """
    Soft constraints:
    - Same department modules (different semesters) on same day+slot is discouraged
      but not forbidden
    """
    soft_violations = []
    
    day_slot_map = defaultdict(list)
    for e in entries:
        key = (e["day"], e["slot"])
        day_slot_map[key].append(e)
    
    for (day, slot), exams in day_slot_map.items():
        dept_map = defaultdict(list)
        for e in exams:
            if e["department"]:
                dept_map[e["department"]].append(e)
        
        for dept, exam_list in dept_map.items():
            # Check pairs from different semesters
            for i in range(len(exam_list)):
                for j in range(i + 1, len(exam_list)):
                    a, b = exam_list[i], exam_list[j]
                    # Only soft violation if different semesters
                    # (same semester is a hard violation handled above)
                    if a["semester"] != b["semester"]:
                        soft_violations.append(
                            f"Soft: {dept} has {a['code']} (sem {a['semester']}) and {b['code']} (sem {b['semester']}) on {day} slot {slot}"
                        )
    
    return soft_violations


def compute_utilization(entries, halls, days, slots_per_day):
    """Calculate hall utilization metrics."""
    total_slots_available = len(halls) * len(days) * slots_per_day
    
    # Count unique (hall, day, slot) combinations used
    used_slots = set()
    for e in entries:
        for hall_with_count in e["halls"]:
            hall_name = extract_hall_name(hall_with_count)
            used_slots.add((hall_name, e["day"], e["slot"]))
    
    total_slots_used = len(used_slots)
    utilization = (total_slots_used / total_slots_available) * 100 if total_slots_available > 0 else 0
    
    # Day distribution
    day_distribution = defaultdict(int)
    for e in entries:
        day_distribution[e["day"]] += 1
    
    return utilization, dict(day_distribution)


def compute_accuracy(hard_count, soft_count):
    """Compute accuracy score (100 is perfect)."""
    # Each hard violation is severe (-10 points)
    # Each soft violation is minor (-1 point)
    return max(0, 100 - hard_count * 10 - soft_count * 1)


def evaluate_timetable(result_json, modules, halls, days, slots_per_day):
    """Main evaluation entrypoint."""
    entries = load_timetable(result_json)
    
    hard_violations = check_hard_constraints(entries, modules)
    soft_violations = check_soft_constraints(entries)
    util, day_load = compute_utilization(entries, halls, days, slots_per_day)
    accuracy = compute_accuracy(len(hard_violations), len(soft_violations))
    
    return {
        "feasible": len(hard_violations) == 0,
        "hard_violation_count": len(hard_violations),
        "hard_violations_detail": hard_violations,
        "soft_violation_count": len(soft_violations),
        "soft_violations_detail": soft_violations[:10],  # Show first 10
        "hall_utilization_percent": round(util, 2),
        "day_load_distribution": day_load,
        "accuracy_score": accuracy,
        "total_exams_scheduled": len(entries)
    }


if __name__ == "__main__":
    from exam_timetable_csp import load_data
    modules, halls = load_data()
    
    days = ["day1", "day2", "day3", "day4", "day5", "day6", "day7", "day8",
            "day9", "day10", "day11", "day12", "day13", "day14"]
    slots_per_day = 2
    
    report = evaluate_timetable(timetable_json, modules, halls, days, slots_per_day)
    
    print("=" * 60)
    print("EXAM TIMETABLE EVALUATION REPORT")
    print("=" * 60)
    print(f"Feasible: {report['feasible']}")
    print(f"Total Exams Scheduled: {report['total_exams_scheduled']}")
    print(f"Accuracy Score: {report['accuracy_score']}/100")
    print(f"Hall Utilization: {report['hall_utilization_percent']}%")
    print()
    print(f"Hard Violations: {report['hard_violation_count']}")
    if report['hard_violations_detail']:
        for v in report['hard_violations_detail']:
            print(f"  - {v}")
    print()
    print(f"Soft Violations: {report['soft_violation_count']}")
    if report['soft_violations_detail']:
        for v in report['soft_violations_detail']:
            print(f"  - {v}")
    print()
    print("Day Load Distribution:")
    for day, count in sorted(report['day_load_distribution'].items(), 
                             key=lambda x: int(x[0].replace('day', ''))):
        print(f"  {day}: {count} exams")
    print()
    print("Full JSON Report:")
    print(json.dumps({k: v for k, v in report.items() 
                      if k not in ['hard_violations_detail', 'soft_violations_detail']}, indent=2))