## LogsThread

This library will save your logs into a database and later show them in a GUI on your browser. By default it is integrated with **express**, **mongo** and **mongoose** by default, but it's possible to write plugins for other dbs and also use logsThread outside an express request).

In short logThreads creates a new thread for each request and closes it at the response. You can add as many logs to this thread as you want. When a thread is closed it flattens the thread into a single registry and save's it into your database.  

Access http://localhost:12970 to visualize the logs.

Here is a basic example of LogsThread implementation
```javascript
const mongoose = require("mongoose");
const express = require("express");
const app = express();

const reqLog = require("logs-thread");
reqLog.setModules({ express, app, mongoose });
reqLog.setCustomSettings("customSettings.json");
reqLog.start();

app.get("/", function(req, res) {
	req.thread.log("note").setMsg("Hello World")
	res.send("Hello World!");
});

app.listen(3000, function() {
	console.log("Example app listening on port 3000");
});
```
This is all you need to create, save and visualize logs.
## GUI
LogsThread offers a friendly Graphic User Interface to display all the logs. Among other functionalities this GUI offers the possibility to:
 - view many logs at once, in a summary list.
 - expand the log information
 - filter the logs with combos personalized with your own information

The available filters are created on the fly using the information from the **groups** property of both the defaultSettings and your customSettings.

By default the available groups are
```javascript
groups:{
	type: { options: []},
	level: { options: ["error", "warn", "log"]},
	importance: { options: ["high", "normal", "low"]}
}
```
meaning you will find 3 drop down menus as soon as you enter the GUI.
The options from type will be auto filled according to the information found on **types**, by default **note** and **unexpected**
```javascript
types: {
	note: {	level:"log",importance:"normal"},
	unexpected:{message:"unexpected error",level:"error",importance:"high"}
}
```
## Automatic Information
The thread automatically collects information about both the request and the response: method, path, query, body and the response itself. It also saves the time and the stack at the log creation's moment (only the most relevant parts). You may exclude any of those properties using the your own custom settings.
The GUI will not show those properties on the summary list, but if you click any log row the GUI will display the log's full information.

## Customization
LogsThread allows high customization of your logs structures and most of it's configurations

```javascript
// it accepts an object or the route to a json file (absolute or relative to the main module)
reqLog.setCustomSettings("customSettings.json");
```
For example, your company has clients and you want save the client name into the thread to later filter them and view only the relevant information. In your custom settings you must add:
```javascript
{groups: {
	client: { 
		options: ["Susan", "John", "Paul"], 
		overlap: "push" 
	}
}}
```
This will create on the GUI a drop down menu so you can filter the logs by one of those clients. To add the information to a log you can do one of the above options at any point of the request flow:
```javascript
req.thread.log("note", {client:"John"}, "Client has logged in.")
// or
req.thread.log("note").setInfo({client:"John"}).setMsg("Client has logged in.")
```
Note that **group** has an **overlap** property. It is used to indicate how the Thread should treat it at the flatten operation if more than one log has the same property. For example:
```javascript
req.thread.log("note", {client:"John"})
req.thread.log("note", {client:"Susan"})
res.send("ok")
```
What should happen with the client, should we keep the first, the last, both? You can set it using one of the following operations: 

 - push, pull -> keeps a copy of each value. You can also pass an Array to the log.
 - sum, min, max - for numbers
 - first, last - chooses one, considering the log order
 - minIndex, maxIndex ->  chooses one, considering the **group.options** order
 - merge -> merge objects

## Debug
You don't need to create a group to add information to the thread. For example, if you have an endPoint to  receive questions from your clients you could just save them , without creating a group:
```javascript
req.thread
	.log("question")
	.setInfo({client:"John"})
	.setDebug({text:req.query.question})
```
This information will be available at GUI when you open some log details.

## Errors
If you encounter an error and wants to log it you can do the following:
```javascript
try{
	//... something bad
}catch(err){
	req.log("unexpected").error(err)
}
```  
This will log information of the error under the type **unexpected**. If you want to create other error types read the next session.

## Types

LogsThread comes with two types of logs: note and unexpected.
```javascript
types: {
	note: {	level:"log",importance:"normal"},
	unexpected:{message:"unexpected error",level:"error",importance:"high"}
}
```
When a log is created all the information above is copied into the log. For example, if you create a note it will have the log level and the normal importance.
Unexpected is used by logsThread to log the errors found by itself.

## Messages
Messages will let you identify a log more easily at the GUI. It will use the last message found on the thread's logs unless you define a message to the thread itself, you can do that by two ways:
```javascript
req.thread.setMsg("This is a thread's messaged")
req.thread.log("note").setMsg("This is a log's message that will overwrite the thread's messaged", true) 
// the true parameter here indicates it is an important message.
```
## GUI Files
LogsThread will generate the needed files on your project's directory and will auto regenerate any missing file if you erase them.
Once it is created it will not overwrite them and you can change them as you wish. 
## GUI CSS
When a log is shown in the summary they will have classes added according to the informations specified by their groups. For example, a log from John will have the class John added both to the log row and to the client row allowing you to add these CSS rules:
```css
log-summary.john{
	background-color: orange;
}

log-tab.john{
	background-color: yellow;
	color: red;
	font-weight: 600;
}
``` 
This will make all the threads row containing john as a client to be viewed in orange and the specific client column to be seen in yellow with red letters.

## Full Settings
This is the full defaultSettings file with some brief explanations in case you want to overwrite them with your own custom settings

```javascript
module.exports  = {
	db: {
		type:  "mongoose", // right now mongoose is the only option, also meaning mongo is the only db option 
		host:  "mongodb://localhost:27017/logs",  // the collection where to save the logs
		group:  "week"  // day, week, month, year, none -> to avoid huge collections we split the logs in groups over time. The GUI allows you to choose in which collection to look. 
	},
	GUI: {
		port:  12970, // the port where the GUI server will be listening
		root:  "./logsThread/" // the path where the files are going to be created inside your project
	},
	express: {
		// create entries for different methods if you want
		get: {
			log: ["method", "path", "query", "response", "time", "stack"], // the information you want to save from get requests
			blackList: [], // not working yet
			whiteList: [] // not working yet
		},
		post: {
			log: ["method", "path", "query", /*"body",*/  "response", "time", "stack"],
			blackList: [],
			whiteList: []
		}
	},
	stackRoot:  "./", // the stack lines are absolute, so we will ignore the parts that are above this relative root. Lines containg node_modules in their path will be fully ignored.
	groups: {
		type: { options: [], overlap:  "push", optional:  false }, // autofill from settings.types[k]
		level: { options: ["error", "warn", "log"], overlap:  "minIndex" },
		//set groups.level = null if you dont want to use level on your logs
		importance: { options: ["high", "normal", "low"], overlap:  "minIndex" }
	},
	types: {
		// create any type you want bu don't delete the "unexpected" type
		note: {
			level:  "log",
			importance:  "normal",
		},
		unexpected: {
			message:  "unexpected error",
			level:  "error",
			importance:  "high"
		}
	}
};
```
Example of custom settings:
```javascript
{
	GUI:{
		port:3001
	},
	db:{
		host: "mongodb://localhost:27017/logsThread"
	},
	groups: {
		developer: { 
			options: ["Tie", "Tomas", "Sergio", "Jesus"], 
			overlap: "push" 
		},
		team: { 
			options: ["developers", "analytics", "support"], 
			overlap: "push" 
		}
	}
	types: {
		login: {
			message: "login",
			level: "log",
			importance: "normal"
		}
	},
	team: {
		message: "Team in the house",
		level: "warning",
		importance: "low"
	}
}
```
