"""Skript to create a statistic of how many participants have been collected for each of the algorithms "IA", "RDT", "SE".

Author:
	Karla Friedrichs
Skript to bachelor thesis:
	"Modeling collaborative reference in a Pentomino domain using the GOLMI framework"
Usage:
	python eval_log.py
"""

import os
import json

# directory containing json files, one per participant
DATA_COLLECTION_PATH = "./app/static/resources/data_collection"

def count_participations(data_collection):
	"""Count participants for each algorithm."""
	participations = dict()
	counter = 0
	# walk the directory and read in each file
	for filename in os.listdir(data_collection):
		if filename.endswith(".json"):
			# parse json data
			with open(os.path.join(data_collection, filename)) as file:
				json_data = json.load(file)
				# increment the counter of the used algorithm
				if "algorithm" in json_data:
					if json_data["algorithm"] not in participations:
						participations[json_data["algorithm"]] = 1
					else:
						participations[json_data["algorithm"]] += 1
					counter += 1
				else:
					print("Error: File {} does not contain 'algorithm' key".format(filename))
	# output the results
	print("-"*20 + "\n")
	print("Total runs: {}".format(counter))
	for alg_name, alg_count in participations.items():
		print("{}: {} runs".format(alg_name, alg_count))
	print("\n" + "-"*20)

def main():
	count_participations(DATA_COLLECTION_PATH)

if __name__ == "__main__":
	main()
