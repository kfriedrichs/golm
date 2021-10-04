"""File: obj.py

Contains the class Obj.
"""

"""Class: Obj
Represents an abstract block-based object manipulable by <Gripper>s.
Contains no logic.
"""
class Obj:
	def __init__(self, obj_type, x, y, width, height, block_matrix, 
		rotation=0, mirrored=False, color="blue", gripped=False):
		"""Func: Constructor
		
		Params:
		obj_type - type name, needs to registered in the <Model>'s <Config>
		x - horizontal position (in blocks)
		y - vertical position (in blocks)
		width - in blocks
			(currently always corresponds to block matrix dimensions)
		height - in blocks
			(currently always corresponds to block matrix dimensions)
		block_matrix - square matrix containing 1s and 0s to describe
			the object's shape
		rotation - in degrees. *default*: 0
		mirrored - _bool_, True if the object is flipped horizontally.
			*default*: False
		color - color string or html color code. *default*: 'blue'
		gripped - _bool_, True if a <Gripper> currently holds this object
		"""
		self.type			= obj_type
		self.x				= x
		self.y				= y
		self.width			= width
		self.height			= height
		self.rotation		= rotation
		self.mirrored		= mirrored
		self.color			= color
		self.block_matrix 	= block_matrix
		self.gripped 		= gripped

	def get_center_x(self):
		"""Func: get_center_x
		
		Returns:
		x coordinate of the object's center
		"""
		return self.x + (self.width/2)

	def get_center_y(self):
		"""Func: get_center_y
		
		Returns:
		y coordinate of the object's center
		"""
		return self.y + (self.height/2)

	def get_left_edge(self):
		"""Func: get_left_edge
		
		Returns:
		the object's left border
		"""
		return self.x

	def get_right_edge(self):
		"""Func: get_right_edge
		
		Returns:
		the object's right border
		"""
		return self.x + self.width

	def get_top_edge(self):
		"""Func: get_rop_edge
		
		Returns:
		the object's top border
		"""
		return self.y

	def get_bottom_edge(self):
		"""Func: get_bottom_edge
		
		Returns:
		the object's bottom border
		"""
		return self.y + self.height

	def to_dict(self):
		"""Func: to_dict
		Constructs a JSON-friendly dictionary representation of this instance.
		
		Returns:
		Dictionary representation of this <Obj> instance.
		"""
		return {
			"type":			self.type,
			"x":			self.x,
			"y":			self.y,
			"width":		self.width,
			"height":		self.height,
			"rotation":		self.rotation,
			"mirrored":		self.mirrored,
			"color":		self.color,
			"block_matrix":	self.block_matrix,
			"gripped":		self.gripped
			}
