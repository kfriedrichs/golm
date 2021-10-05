"""File: run.py
Entrypoint for the GOLMI server application.
Call with -h option for more information on the command line options.
Runs on host 127.0.0.1 and port 5000 per default.
--test option currently not implemented.

Usage:
    > run.py [-h] [--host HOST] [--port PORT] [--test]
"""

import argparse
from app import app, socketio  # , test

# --- command line arguments ---
parser = argparse.ArgumentParser(description="Run GOLMI's model API.")
parser.add_argument("--host", type=str, default="127.0.0.1",
                    help="Adress to run the API on. Default: localhost.")
parser.add_argument("--port", type=str, default="5000",
                    help="Port to run the API on. Default: 5000.")
parser.add_argument("--test", action="store_true",
                    help="Pass this argument to perform some tests" + \
                    "before the API is run.")

if __name__ == "__main__":
    args = parser.parse_args()
    if args.test:
        # will throw errors if something fails
        # TODO: Golmi has not yet updated its unit tests, uncomment
        # this line to re-introduce the option.
        # test.selftest()
        # print("All tests passed.")
        print("Warning: Selftest currently not implemented.")
    socketio.run(app, host=args.host, port=args.port)
