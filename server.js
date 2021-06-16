const express = require('express')
const app = express()
const path = require('path')
const http = require('http')
const server = http.createServer(app)

const formatMessage = require('./utils/messages')
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')


const socketio = require('socket.io')
const io = socketio(server)

const botName = 'ChatCord Bot'

// set static folder
app.use(express.static(path.join(__dirname, 'public')))

// run when client connects
io.on('connection', (socket) => {

	socket.on('joinRoom', ({username, room}) => {

		const user = userJoin(socket.id, username, room)
		socket.join(user.room)

		// welcomes current user.
		socket.emit("message", formatMessage(botName, 'Welcome to ChatCord'))		// sends to single user that's connecting.

		// broadcast when a user connects.
		socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined that chat.`))	// send msg to all clients except ourself.

		// send users and room info
		io.to(user.room).emit('roomUsers',{
			room: user.room,
			users: getRoomUsers(user.room)
		})
	})

	// listen for chatMessage
	socket.on("chatMessage", (msg) => {
		const user = getCurrentUser(socket.id)
		io.to(user.room).emit('message', formatMessage(user.username, msg))	// broadcast to everybody.
	})

	// runs when client disconnects.
	socket.on('disconnect', () => {
		const user = userLeave(socket.id)
		if(user){
			io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat.`))
			
			// send users and room info
			io.to(user.room).emit('roomUsers',{
			room: user.room,
			users: getRoomUsers(user.room)
			})
		}
	})
})

const PORT = 3000
server.listen(PORT, () => {
	console.log("SERVER RUNNING ON PORT ", PORT)
})
