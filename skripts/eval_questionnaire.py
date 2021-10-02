"""Skript to evaluate the questionnaires.

Author:
	Karla Friedrichs
Evaluation skript to bachelor thesis:
	"Modeling collaborative reference in a Pentomino domain using the GOLMI framework"
Usage:
	python eval_questionnaire.py
"""

import os
import json
import numpy as np
from urllib.parse import unquote
from plot_helper import create_hist, create_bar, create_line, create_horizontal_stack

### globals ###

# directory containing json files, one per participant
DATA_COLLECTION_PATH = "./app/static/resources/data_collection"
# directory to save created plots to
PLOT_PATH = "./resources/plots"
# directory for various files used in the evaluation
MISC_PATH = "./resources/eval"

ALGORITHMS = ["IA", "RDT", "SE"]
LINESTYLES = {"IA": "-", "RDT": "dotted", "SE": "--"}
KEYS = [
	"audiotest", "age", "gender", "education", "language", "fluency", "pentoVeteran", "comments",
	"anthropomorphism1", "anthropomorphism2", "anthropomorphism3",
	"likeability1", "likeability2", "likeability3",
	"intelligence1", "intelligence2", "intelligence3"
	]

def eval_questionnaire():
	"""Prints and visualizes category_counts from the questionnaires."""
	q_data = read_questionnaires()
	# present the category_counts, e.g. output average & missing answers, create a plot
	# audiotest
	print_audiotest(q_data)
	# age
	eval_age(q_data)
	# fluency
	eval_fluency(q_data)
	# godspeed questionnaire
	eval_godspeed(q_data)
	# gender
	eval_gender(q_data)
	# education
	eval_education(q_data)
	# language
	eval_language(q_data)
	# played Pentomino before
	print_pento_veteran(q_data)
	# comments
	# write comments into separate files for manual inspection
	write_comments(q_data)
	
### evaluation of specific keys ###

def print_audiotest(data):
	"""Simply print all audiotest answers to the console.
	
	@param data	questionnaire data
	"""
	audiotest_list, no_audiotest = _str_unquote(data["all"]["audiotest"])
	if no_audiotest > 0:
		print(audiotest_list, no_audiotest)

def eval_age(data):
	"""Print average age to the console and create a histogram for each algorithm.
	
	@param data	questionnaire data
	"""
	print("-"*20 + "\nAge\n" + "-"*20)
	for alg in ["all"] + ALGORITHMS:
		print("-"*20 + "\n" + alg)
		# number of participants
		print("Runs: {}".format(len(data[alg]["age"])))
		print("-"*20 + "\n")
		age_list, no_age = _str_to_int(data[alg]["age"])
		average = np.mean(age_list)
		print("{}: {} on average ({} times no answer)".format(alg, average, no_age))
		
		create_hist(
			age_list, title="{}: Age ({} answers)".format(alg, len(age_list)),
			savepath=os.path.join(PLOT_PATH, "age_{}.png".format(alg)),
			xmin=16, xmax=60,  x_axislabel="Age", y_axislabel="Number of participants")

def eval_fluency(data):
	"""Print average fluency to the console and create a bar plot (including the standard deviation) for all algorithms.
	
	@param data	questionnaire data
	"""
	print("-"*20 + "\nFluency\n" + "-"*20)
	fluency_averages = list()
	fluency_stddevs = list()
	n_answers = -1
	for alg in ["all"] + ALGORITHMS:
		fluency_list, no_fluency = _str_to_int(data[alg]["fluency"])
		if alg == "all":
			n_answers = len(fluency_list)
		average = np.mean(fluency_list)
		print("{}: {} on average ({} times no answer)".format(alg, average, no_fluency))
		fluency_averages.append(average)
		fluency_stddevs.append(np.std(fluency_list))
	create_bar(
		["all"] + ALGORITHMS, fluency_averages,
		category_error=fluency_stddevs,
		title="Average fluency with standard deviation\n({} answers)".format(n_answers),
		savepath=os.path.join(PLOT_PATH, "fluency.png"),
		y_axislabel="average self-assigned fluency score", y_lim=(1,7))

def eval_godspeed(data):
	"""Print average godspeed ratings to the console and create a line plot for anthropomorphism, likeability and intelligence.
	
	@param data	questionnaire data
	"""
	print("-"*20 + "\nGodspeed\n" + "-"*20)
	labels = {
			"anthropomorphism1": "machinelike/humanlike",
			"anthropomorphism2": "unconscious/conscious",
			"anthropomorphism3": "artificial/lifelike",
			"likeability1": "dislike/like",
			"likeability2": "unfriendly/friendly",
			"likeability3": "unpleasant/pleasant",
			"intelligence1": "incompetent/competent",
			"intelligence2": "irresponsible/responsible",
			"intelligence3": "unintelligent/intelligent"
			}
	# evaluate each rating group
	for aspect in ["anthropomorphism", "likeability", "intelligence"]:
		aspect_ratings = dict()
		for alg in ALGORITHMS:
			print(alg)
			aspect_ratings[alg] = list()
			for i in range(1, 4):
				rating_list, no_answer = _str_to_int(data[alg][aspect+str(i)])
				average = np.mean(rating_list)
				print("{}: {} on average ({} times no answer)".format(
					labels[aspect+str(i)], average, no_answer))
				aspect_ratings[alg].append(average)
		x_ticklabels = [labels[aspect+str(i)] for i in range(1, 4)]
		# create a plot comparing the algorithms
		create_line(
			ALGORITHMS, aspect_ratings,
			title="Average perception of {}".format(aspect),
			savepath=os.path.join(PLOT_PATH, "{}.png".format(aspect)),
			x_ticklabels=x_ticklabels, y_axislabel="Average rating",
			y_lim=(1,7), linestyles=LINESTYLES)

def eval_gender(data):
	"""Print gender distribution to the console and create a single horizontal stacked bar plot.
	
	@param data	questionnaire data
	"""
	print("-"*20 + "\nGender\n" + "-"*20)
	gender_data = dict()
	gender_cats = ["female", "non-binary", "male"]
	n_answers = -1
	for alg in ["all"] + ALGORITHMS:
		gender_list, no_gender = _str_unquote(data[alg]["gender"])
		if (alg == "all"): n_answers = len(gender_list)
		print("{}: {} times no answer".format(alg, no_gender))
		# use percent option to create a plot displaying the distribution
		cat_count = _count_categories(
			gender_list,
			os.path.join(MISC_PATH, "gender_cats.txt"),
			percent=True)
		for cat, count in cat_count.items():
			print("{}:\t{}".format(cat, count))
		gender_data[alg] = [cat_count[cat] for cat in gender_cats]
	# create a plot
	create_horizontal_stack(
		gender_cats, gender_data,
		title="Gender distribution (in %, {} answers)".format(n_answers))

def eval_education(data):
	"""Print highest completed education to the console and create a bar plot for each algorithm.
	
	@param data	questionnaire data
	"""
	print("-"*20 + "\nEducation\n" + "-"*20)
	ed_cats = [
		"secondary school", "Bachelor", "Master", "PhD",
		"apprenticeship", "master craftsman"
		]
	for alg in ["all"] + ALGORITHMS:
		education_list, no_education = _str_unquote(data[alg]["education"])
		print("{}: {} times no answer".format(alg, no_education))
		cat_count = _count_categories(
			education_list, os.path.join(MISC_PATH, "education_cats.txt"))
		for cat, count in cat_count.items():
			print("{}:\t{}".format(cat, count))
		create_bar(
			ed_cats, [cat_count[cat] for cat in ed_cats],
			title="{}: Highest completed education ({} answers)".format(alg, len(education_list)),
			savepath=os.path.join(PLOT_PATH, "education_{}.png".format(alg)),
			y_axislabel="Number of participants")

def eval_language(data):
	"""Print first language to the console and create a bar plot for each algorithm.
	
	@param data	questionnaire data
	"""
	print("-"*20 + "\nLanguage\n" + "-"*20 )
	lang_cats = [
		"German", "English", "French", "Portuguese",
		"English/Arabic", "German/Serbian"
		]
	for alg in ["all"] + ALGORITHMS:
		lang_list, no_lang = _str_unquote(data[alg]["language"])
		print("{}: {} times no answer".format(alg, no_lang))
		cat_count = _count_categories(
			lang_list, os.path.join(MISC_PATH, "language_cats.txt"))
		for cat, count in cat_count.items():
			print("{}:\t{}".format(cat, count))
		create_bar(
			lang_cats, [cat_count[cat] for cat in lang_cats],
			title="{}: First language(s) ({} answers)".format(alg, len(lang_list)),
			savepath=os.path.join(PLOT_PATH, "language_{}.png".format(alg)),
			y_axislabel="Number of participants")

def print_pento_veteran(data):
	"""Simply print the number of Pentomino veterans to the console.
	
	@param data	questionnaire data
	"""
	print("-"*20 + "\nPentoVeteran\n" + "-"*20)
	for alg in ["all"] + ALGORITHMS:
		# simply count how many times "True" was selected
		print("{}: {} played Pentomino before".format(alg, data[alg]["pentoVeteran"].count(True)))

def write_comments(data):
	"""Write comments into separate files for each algorithm.
	
	@param data	questionnaire data
	"""
	for alg in ["all"] + ALGORITHMS:
		# write comments into a file for manual evaluation
		comment_file = open(os.path.join(MISC_PATH, "comments_{}.txt".format(alg)), mode="w")
		for comment in data[alg]["comments"]:
			comment = comment.strip()
			if len(comment) > 0:
				# Asterisk at the beginning to visually separate the algorithms
				comment_file.write("* " + unquote(comment) + "\n")
		comment_file.close()

### read data ###

def read_questionnaires():
	"""
	Reads in all json files and extract questionnaire answers.
	
	@return dictionary answers per algorithm and accumulated
	"""
	data = {alg: {key: list() for key in KEYS} for alg in ["all"] + ALGORITHMS}
	
	# walk the directory and read in each file
	for filename in os.listdir(DATA_COLLECTION_PATH):
		if filename.endswith(".json"):
			# parse json data
			with open(os.path.join(DATA_COLLECTION_PATH, filename)) as file:
				json_data = json.load(file)
				# make sure file has "algorithm" key with valid value
				assert "algorithm" in json_data, "Error: missing 'algorithm' entry in file {}".format(filename)
				alg = json_data["algorithm"]
				assert alg in ALGORITHMS, "Error: invalid 'algorithm' entry in file {}".format(filename)
				
				# read in all keys
				for key in KEYS:
					# make sure all expected keys are present
					assert key in json_data, "Error: key {} missing in file {}".format(key, filename)
					
					# save value for "all" and the used algorithm
					data["all"][key].append(json_data[key])
					data[alg][key].append(json_data[key])
	return data

### preprocessing ###

def _str_to_int(answer_list):
	int_list = list()
	no_answer = 0
	for i in range(len(answer_list)):
		if answer_list[i].isdigit():
			int_list.append(int(answer_list[i]))
		elif answer_list[i] == "" or answer_list[i] == "-":
			no_answer += 1
		else:
			print("Non-numeric answer found in _str_to_int: {}".format(answer_list[i]))
			no_answer += 1
	return int_list, no_answer
	
def _str_unquote(answer_list):
	str_list = list()
	no_answer = 0
	for i in range(len(answer_list)):
		answer = unquote(answer_list[i]).strip()
		if answer == "" or answer == "-":
			no_answer += 1
		else:
			str_list.append(answer)
	return str_list, no_answer
	
### statistics helper functions ###

def _get_average(answer_dict):
	n_answers	= 0	# number of valid numeric answers
	answer_sum	= 0	# sum of numeric answers
	no_answer = 0	# number of invalid or empty answers
	
	# assume all keys can be cast to int or are the empty string
	for answer, count in answer_dict.items():
		if answer == "" or answer == "-":
			no_answer += count
		elif not answer.isdigit():
			print("Non-numeric answer found in _get_average: {}".format(answer))
			no_answer += count
		else:
			n_answers += count
			answer_sum += int(answer) * count
	return answer_sum/n_answers, no_answer

def _count_categories(answer_list, category_file, percent=False):
	# read in the categories
	category_map = dict()
	cats = set()
	cat_file = open(category_file, mode="r")
	for line in cat_file:
		line = line.strip()
		if len(line) == 0: continue
		# tab character separates category name and related strings
		category, identifiers = line.split("\t")
		cats.add(category)
		# comma separates related strings
		for identifier in identifiers.split(","):
			category_map[identifier] = category
	cat_file.close()
	# assign answers to categories and count
	category_counts = {cat: 0 for cat in cats}
	for answer in answer_list:
		# ignore surrounding whitespace
		answer = answer.strip()
		if answer not in category_map:
			print("Answer {} could not be matched with any category".format(answer))
		else:
			category_counts[category_map[answer]] += 1
	if percent:
		# normalize all counts
		answer_sum = sum(category_counts.values())
		for cat in category_counts:
			category_counts[cat] = round(100 * (category_counts[cat] / answer_sum), 1)
	return category_counts



def main():
	eval_questionnaire()

if __name__ == "__main__":
	main()

