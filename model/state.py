"""File: state.py

Contains the class State.
"""

from copy import deepcopy


"""Class: State
Represents a snapshot of all transient data of a <Model>.
In particular, holds <Obj>s and <Gripper>s, allows to access
directly change their data.
"""
class State:
    def __init__(self):
        """Func: Constructor"""
        # Variable: objs
        # dictionary mapping ids to <Obj>s
        self.objs = dict()
        # Variable: grippers
        # dictionary mapping ids to <Gripper>s
        self.grippers = dict()

    def get_obj_dict(self):
        """ Func: get_obj_dict
        
        Returns:
        dictionary mapping <Obj> ids to <Obj> dictionaries
        """
        return {obj_id: obj.to_dict() for obj_id, obj in self.objs.items()}

    def get_object_ids(self):
        """ Func: get_obj_ids
        
        Returns:
        iterable of the <Obj>s' ids
        """
        return self.objs.keys()

    def get_obj_by_id(self, id):
        """ Func: get_obj_by_id
        
        Params:
        id - registered identifier of the <Obj> to retrieve
        
        Returns:
        <Obj> instance, if existing, else None
        """
        if id in self.objs:
            return self.objs[id]
        else:
            return None

    def get_gripper_dict(self):
        """Func: get_gripper_dict
        In contrast to get_obj_dict, each gripper dict has the entry "gripped",
        which itself is None or a dictionary mapping the gripped object to an
        object dictionary.
        
        Returns:
        dictionary mapping <Gripper> ids to <Gripper> dictionaries
        """
        gr_dict = dict()
        for gr_id, gr in self.grippers.items():
            gr_dict[gr_id] = gr.to_dict()
            # if some object is gripped, add all the info on that object too
            if gr.gripped:
                gr_dict[gr_id]["gripped"] = {gr.gripped: self.get_obj_by_id(gr.gripped).to_dict()}
            else:
                gr_dict[gr_id]["gripped"] = None
        return gr_dict

    def get_gripper_ids(self):
        """Func: get_gripper_ids
        
        Returns:
        iterable of the <Gripper>s' ids
        """
        return self.grippers.keys()

    def get_gripper_by_id(self, id):
        """Func: get_gripper_by_id
        
        Params:
        id - registered identifier of the <Gripper> to retrieve
        
        Returns:
        <Gripper> instance, if existing, else None
        """
        if id in self.grippers:
            return self.grippers[id]
        else:
            return None

    def get_gripper_coords(self, id):
        """Func: get_gripper_coords
        
        Params:
        id - registered identifier of the <Gripper> in question
        
        Returns:
        _list_: [x, y] or empty list if id does not exist
        """
        if id in self.grippers:
            return [self.grippers[id].x, self.grippers[id].y]
        else:
            return list()

    def get_gripped_obj(self, id):
        """Func: get_gripped_obj
        
        Params:
        id - registered identifier of the <Gripper> in question
        
        Returns:
        None or the id of the gripped <Obj>
        """
        if id in self.grippers:
            return self.grippers[id].gripped
        else:
            return None

    def move_gr(self, id, dx, dy):
        """Func: move_gr
        Change a <Gripper> position by moving in direction (dx, dy).
        
        Params:
        id - id of the <Gripper> to move, has to be registered
        dx - x direction
        dy - y direction
        """
        self.grippers[id].x += dx
        self.grippers[id].y += dy

    def move_obj(self, id, dx, dy):
        """Func: move_gr
        Change an <Obj> position by moving in direction (dx, dy).
        
        Params:
        id - id of the <Obj> to move, has to be registered
        dx - x direction
        dy - y direction
        """
        self.get_obj_by_id(id).x += dx
        self.get_obj_by_id(id).y += dy

    def rotate_obj(self, id, d_angle, rotated_matrix=None):
        """Func: rotate_obj
        Change an <Obj>'s goal_rotation by d_angle.
        
        Params:
        id - id of the <Obj> to rotate, has to be registered
        d_angle - current angle is changed by d_angle
        rotated_matrix - optional: pre-rotated block matrix,
            otherwise the current matrix is rotated
        """
        if d_angle != 0:
            obj = self.get_obj_by_id(id)
            obj.rotation = (obj.rotation + d_angle) % 360
            # update block matrix
            if rotated_matrix:
                obj.block_matrix = rotated_matrix
            else:
                obj.block_matrix = self.rotate_block_matrix(obj.block_matrix, d_angle)

    def flip_obj(self, id, flipped_matrix=None):
        """Func: flip_obj
        Mirror an <Obj>.
        
        Params:
        id - id of the <Obj> to flip, has to be registered
        flipped_matrix - optional: pre-flipped block matrix,
            otherwise the current matrix is flipped
        """
        # change 'mirrored' attribute
        obj = self.get_obj_by_id(id)
        obj.mirrored = not obj.mirrored
        # update the block matrix
        if flipped_matrix:
            obj.block_matrix = flipped_matrix
        else:
            obj.block_matrix = self.flip_block_matrix(obj.block_matrix)

    def grip(self, gr_id, obj_id):
        """Func: grip
        Attach a given <Obj> to the <Gripper>.
        
        Params:
        gr_id - id of the <Gripper> that grips obj_id
        obj_id - id of the <Obj> to grip, has to be registered
        """
        self.objs[obj_id].gripped = True
        self.grippers[gr_id].gripped = obj_id

    def ungrip(self, id):
        """Func: ungrip
        Detach the currently gripped <Obj> from the <Gripper>.
        
        Params:
        id - id of the <Gripper> that ungrips
        """
        self.objs[self.grippers[id].gripped].gripped = False
        self.grippers[id].gripped = None

    def rotate_block_matrix(self, old_matrix, d_angle):
        """Func: rotate_block_matrix
        Rearrange blocks of a 0/1 block matrix to apply some rotation.

        Params:
        old_matrix - block matrix describing the current block positions
        d_angle - _float_ or _int_, angle to apply.
            Can be negative for leftwards rotation.

        Returns:
        the new block matrix with changed block positions
        """
        # normalize the angle (moves all values in the range [0-360[ )
        d_angle = d_angle % 360
        # can only process multiples of 90, so round to the next step here
        approx_angle = round(d_angle / 90) * 90
        # nothing to do if rotation is 0
        if approx_angle == 0:
            return old_matrix
        # start building a new, rotated matrix
        new_matrix = list()
        height = len(old_matrix)
        assert height > 0, "Error:" + \
            " Empty block matrix passed to rotate_block_matrix() at class State"
        width = len(old_matrix[0])
        assert width > 0, "Error:" + \
            " Block matrix with empty rows passed to rotate_block_matrix()" + \
            " at class State"
        for row in range(height):
            # new empty row
            new_matrix.append(list())
            for col in range(width):
                # fill out the new matrix by copying values of the old matrix
                if approx_angle == 90:
                    new_matrix[row].append(old_matrix[(width - 1) - col][row])
                elif approx_angle == 180:
                    new_matrix[row].append(old_matrix[(height - 1) - row][(width - 1) - col])
                elif approx_angle == 270:
                    new_matrix[row].append(old_matrix[col][(height - 1) - row])
                else:
                    print("Error: Invalid turning angle at",
                          "_rotateByRearrange(): ",
                          approx_angle)
        return new_matrix

    def flip_block_matrix(self, old_matrix):
        """Func: flip_block_matrix
        Flips blocks using a horizontal axis of reflection.

        Params:
        old_matrix - block matrix describing the current block positions

        Returns:
        a new block matrix with 1s in horizontally mirrored positions
        """
        # make a deep copy
        new_matrix = deepcopy(old_matrix)
        # simply reverse the order of rows
        new_matrix.reverse()
        return new_matrix

    def to_dict(self):
        """Func: to_dict
        Constructs a JSON-friendly dictionary representation of this instance.

        Returns:
        Dictionary representation of this <State> instance.
        """
        state_dict = dict()
        state_dict["grippers"] = self.get_gripper_dict()
        state_dict["objs"] = self.get_obj_dict()
        return state_dict
