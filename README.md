# Modeling collaborative reference in a Pentomino domain using the GOLMI framework

This repository is an extension to the 
[GOLMI framework](https://github.com/clp-research/golmi)
created in the course of my Bachelor's thesis.

The main interface was used for an experiment comparing 3 rule-based collaborative
REG (referring expression generation) algorithms.
Participants play a Pentomino game
together with an instruction giving agent, which randomly uses one of the
tested algorithms.

For more information on the choice of algorithms and implementation details,
please consult the thesis.
For more information on GOLMI, please refer to its 
[main repository](https://github.com/clp-research/golmi). 

### How to start the interface

0. (Activate your virtual environment, if using one)
1. Install python dependencies: `pip install -r requirements.txt`
2. Run the server: `python run.py [-h] [--host HOST] [--port PORT] [--test]`. 
Per default, it will run on `http://localhost:5000/`
3. Navigate to  `http://localhost:5000/` in a browser.
4. Follow the instructions.

### Documentation

Open `doc/index.html` in a browser for a structured documentation of all files and classes.

### Code to the interface

The client-side interface is set up in `golm/app/static/js/index.js` 
(the html can be found in app/templates/index.html). 
Here, the user is presented an introductory explanation as well as an audio test 
using [dialogs](https://github.com/GoogleChrome/dialog-polyfill). Instances of
the necessary view and controller modules (see below) are created and the tasks
are retrieved from the `/get_tasks/ba_tasks` endpoint. Once the user is ready, 
a socket connection to the model is build and the tasks are loaded. Once
all tasks are complete, the questionnaire is opened. To conclude, 
the questionnaire answers are added to the log and all logged data is posted to
the `/save_log` endpoint.

### Extensions to GOLMI: MVC components

While the GOLMI framework provides a server-client structure as building 
ground for experiments evolving around object manipulations, a few classes 
were added or modified for this instantiation.

#### Views: GUI, logging, instruction giving

For the graphic interface, the pre-built `View` and `LayerView` classes were used.

GOLMI's `LogView` (contained in `LView.js`) is employed for logging, setting
`logFullState` to False for sparse log files. To separate tasks, the 
`logSegment` event is used. Instructions and  feedback messages are added to the 
log using the `emitMessage` event.

Finally, a completely new view was built for instruction giving: `IGView`. The 
class contains the basic flow and all 3 algorithms, it also emits the appropriate
events to the LogView instance. Some helper functions are stored in `util.js`.

#### Controller

GOLMI's LocalKeyController was used.

#### Model

No extensions to GOLMI's model were made.

### Task generation

For development, the `PentoGenerator` class can be used to create random states.
However, for the study, the task generator currently residing [here](https://github.com/kfriedrichs/pentomino-js) 
as `task_creator_study1.html` was used.

### Evaluation skripts

Additionally, the `scripts` directory contains python3 scripts to evaluate
any log files located in `app/static/resources/data_collection`. 
The following table describes the use of each script:

| name | usage | description |
| --- | --- | --- |
| `create_audio_instr.py` | `python3 create_instr_audio.py [-h] -f FILE -o OUT_DIR` | Create audio files for a list of instructions. Use -h option for more information on the command line parameters. Set up of an Amazon Polly profile is required. See [Amazon's docs](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/quickstart.html) and use `export PROFILE=profilename` to set your profile name as an environment variable the script can find. | 
| `count_collected_algs.py` | `python3 count_collected_algs.py` | Skript to create a statistic of how many participants have been collected for each of the algorithms "IA", "RDT", "SE". |
| `eval_log.py` | `python3 eval_log.py` | Skript to evaluate the task logs. |
| `eval_questionnaire.py` | `python3 eval_questionnaire.py` | Skript to evaluate the questionnaires. |
| `plot_helper.py` | (not meant for execution)  | Helper functions to create plots. | 

### Additional data files

The following files contain data for the experiment itself or for evaluation purposes:

| name | description |
| --- | --- |
| `resources/ba_instructions.txt` | List of instruction / feedback messages used by the instruction giver, one message per line. Input to the `create_audio_instr.py` script. |
| `resources/eval/` | Contains `txt` files for questionnaire evaluation: variations of freeform input received for *education*, *gender* and *language* are mapped to categories. Used by `eval_questionnaire.py` |
| `app/static/resources/tasks/ba_tasks.json` | 13 tasks used in the experiment, in `json` format. Served by the app at the `/get_tasks/ba_tasks` endpoint, retrieved by the clien via GET request, then sent to the model. |
| `app/static/resources/tasks/ba_tasks/` | Contains each of the 13 tasks in a separate file, in `json` format. |
| `app/static/resources/audio/` | Contains the mp3 files of all instruction / feedback messages listed in `resources/ba_instructions.txt`, created using the `create_audio_instr.py` script. |
| `app/static/resources/img/` | Contains images used in the `welcome` dialog initially presented to participants. |

