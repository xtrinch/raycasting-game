# 3d game created with raycasting in Javascript / React

The general idea for the math setup and walls raycasting is taken from https://lodev.org/cgtutor/raycasting.html.
It uses vectors to define our direction / camera plane instead of angles.
The ceiling / walls are instead raycasted using arbitrary quad mapping on 2d html canvas as drawing pixel by pixel has turned out to be too slow for javascript.

The general setup is done with React, using Mobx as state management.

See it live at https://xtrinch.github.io/raycasting-game/.
