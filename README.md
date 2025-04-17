# Collaborative-Whiteboard
A real-time web-based collaboration whiteboard that allows multiple users to draw on a canvas concurrently, where each user is assigned a random colour.

  ![image](https://github.com/user-attachments/assets/383bbe61-5bf4-42e5-a3ed-cbee4c38b3bc)

# Functions
- Real time drawing sychronization over multiple users
- Random and unique colour assigned to each user
- Restored drawing history for new user connections
- User-specific sychronized "Clear" button to clear only the user's drawing

# Tech Stack
- Front end: HTML5, Vanilla JavaScript
- Backend: WebSocket Server, NodeJS

# Installation
The computer running the program must have NodeJS(https://nodejs.org/en) v16+ installed. 

1. After that, first clone the repository
<pre>
git clone <repository-url>
cd Collaborative-Whiteboard 
</pre>

2. To run the WebSocket server, run:
<pre>node server.js</pre>

3. Open the index.html file in your browser and start drawing

# Testing
1. Run the WebSocket server by running `node server.js` in terminal
2. Open the `index.html` file in your browser. To test real-time concurrency, open the file in multiple browser windows
3. Try drawing on one of the windows, you should be able to see your drawing appear on the other canvases in other windows as well

# Key Components

## Server side
1. Creates a WebSocket server using HTTP upgrade protocol
2. Stores all connected clients in an array
3. Assigns each client a unique ID and unique color.
4. Stores all drawing history in an array for newly conncted users and to redraw after clear function
5. Listens for:
  - `draw` events and broadcasts to other users
  - `clear`event: deletes on;y the sender's drawings and broadcasts to others

## Client side
1. Connects via WebSocket and initializes drawing events.
2. Uses canvas to render real-time circles with specific brush size & color.
3. Maintains `allDrawings` locally for easy re-rendering after clear.
4. Captures mouse events (down, move, up)
5. Sends drawing data to the server

# Network Disruption Handling

- If a client disconnects:
  - Their unique color is released and can be reused

- If a client reconnects:
  - They are assigned a new ID and new color.
  - They receive the drawing history and join live.



