from eval_log import N_TASKS
from eval_log import read_logs


def eval_log_for_pub():
    logs = read_logs()
    eval_movement_during_initial_instruction(logs)


def eval_movement_during_initial_instruction(logs, tasks=list(range(N_TASKS))):
    """Check how often (and how early) the gripper was moved before the first
    instruction was complete.
    """
    log_key = "log"
    for alg, log in logs.items():
        print("-" * 5 + "\t" + alg + "\t" + "-" * 5)

        n_movements_during_initial_instr = 0
        n_tasks_with_movement_during_initial_instr = 0
        sum_time_before_instr_end_all_movements = 0
        sum_time_before_instr_end_first_movement = 0

        for i_run, run in enumerate(log):
            for i, task in enumerate(tasks):
                start_first_instr, first_instr_entry = get_first_instr_entry(run[task][log_key])
                end_first_instr = start_first_instr + first_instr_entry["duration"] * 1000
                movement_found = False
                for timestamp, entry in run[task][log_key]:
                    if timestamp > end_first_instr:
                        break
                    elif "gripper" in entry:
                        if not movement_found:  # update per-task counters
                            n_tasks_with_movement_during_initial_instr += 1
                            sum_time_before_instr_end_first_movement += end_first_instr - timestamp
                            movement_found = True
                        n_movements_during_initial_instr += 1
                        sum_time_before_instr_end_all_movements += end_first_instr - timestamp

        n_runs = len(log) * len(tasks)
        mean_movements_during_initial_instr = n_movements_during_initial_instr / n_runs
        percentage_tasks_with_early_movement = n_tasks_with_movement_during_initial_instr / n_runs
        if n_movements_during_initial_instr > 0:
            average_time_before_instr_end_all_movements = \
                sum_time_before_instr_end_all_movements / n_movements_during_initial_instr
        else:
            average_time_before_instr_end_all_movements = 0

        if n_tasks_with_movement_during_initial_instr > 0:
            average_time_before_instr_end_first_movement = \
                sum_time_before_instr_end_first_movement / n_tasks_with_movement_during_initial_instr
        else:
            average_time_before_instr_end_first_movement = 0

        print("Number of tasks with movement during the initial instruction: "
              f"{n_tasks_with_movement_during_initial_instr}/{n_runs} "
              f"({100*percentage_tasks_with_early_movement:.1f}%)")
        print(f"Number of movements during the initial instruction: {n_movements_during_initial_instr}")
        print(f"Average early movements per task: {mean_movements_during_initial_instr:.3f}")

        print(f"Average time to instruction end, first movement: {average_time_before_instr_end_first_movement:.0f}ms")
        print(f"Average time to instruction end, all movements: {average_time_before_instr_end_all_movements:.0f}ms")


def get_first_instr_entry(log):
    """Returns the first instruction type entry and its timestamp.
    @param log  iterable run log containing (timestamp, entry) pairs
    """
    for timestamp, entry in log:
        if "type" in entry and entry["type"] == "instruction":
            return timestamp, entry
    raise ValueError(f"No instruction found in log:\n{log}")

def main():
    eval_log_for_pub()


if __name__ == "__main__":
    main()
