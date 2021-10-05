"""File: gripper.py

Contains the class Gripper.
"""
from model.obj import Obj


"""Class: Gripper
Class representing a directly manipulable grappler. It can 'hold'
a single <Obj> to perform move it etc. Think of a gripper as the
claw in a crane game. Contains no logic.
"""
class Gripper(Obj):
    def __init__(self, x, y, gripped=None, width=1, height=1, color="blue"):
        """Func: Constructor
        Note: "gripped" is polymorphic here. For <Obj>, it is a _Bool_
        signifying whether the object is gripped. For <Gripper>, it maps
        to None or the id of the <Obj> instance that is currently gripped.
        Not all <Obj> may be used in practice, e.g. is does not make much
        sense to rotate the gripper itself.
        
        Params:
        x - horizontal position (in blocks)
        y - vertical position (in blocks)
        gripped - id of the <Obj> instance currently held. The containing
            <State> should know the id. *default*: None
        width - in blocks. Currently always *default*: 1
        height - in blocks. Currently always *default*: 1
        color - color string or html color code. *default*: 'blue'
        """
        Obj.__init__(self, "gripper", x, y, width, height, [[1]],
                     rotation=0, mirrored=False, color=color, gripped=gripped)

    def to_dict(self):
        """Func: to_dict
        Constructs a JSON-friendly dictionary representation of this instance.
        
        Returns:
        Dictionary representation of this <Gripper> instance.
        """
        return {
            "x": self.x,
            "y": self.y,
            "color": self.color}
