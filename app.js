// 2. prejmenovat Log
var fs = require("fs");
var sys = require("sys");
var exec = require("child_process").exec;
var colors = require("colors");

var LessWatchDog = function(file, log){
	this._file = file;
	this._log = log;
	this._regexForSearchLess = /@import \"(\w+\.less)"/m; //@todo lepsi regularku, // soubory musi mit priponu less! nejak upozornit uzivatele
	this._watchedFiles = [file];
	this._lastChanges = [];

	if (!this._verifyFile()) {
		this._log.help();
		return console.log("Nebyl zadan soubor!\n\n $ lessWatchDog absolutePathOfFile \n");
	}

	this._absolutePathStyleFile = this._file.replace(/\/[\w\.0-9-_]+$/, ""); // odkroji soubor a ponecha pouze absolutni cestu

	this._searchAllFile();
}


/**
 * overi jestli byl zadan vstupni soubor
 * @return {Boolean}
 */
LessWatchDog.prototype._verifyFile = function(){
	return (fs.existsSync(this._file));
}

LessWatchDog.prototype._searchAllFile = function(){
	fs.readFile(this._file, "utf8", function(err, data){
		if (err) { return this._log.print(err, "error"); };

		var lines = data.split("\n");

		lines.forEach(function(line){
			var tmp = this._regexForSearchLess.exec(line);

			if (tmp != null && tmp[1] && tmp[0]) {
				var absolutePathOfFile = this._absolutePathStyleFile + "/" + tmp[1];

				if (this._watchedFiles.indexOf(absolutePathOfFile) == -1) { this._watchedFiles.push(absolutePathOfFile); }; // jestli uz tam jednou neni tak ho pridame
			};
		}, this);

		this._printWatchedFiles();
		this._startWatchingFiles();

	}.bind(this));
}

LessWatchDog.prototype._startWatchingFiles = function(){
	this._watchedFiles.forEach(function(file){
		fs.watchFile(file, function(curr, prev){
			/* spustime lesscompiler */
			var date = new Date();
			var minutes = (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
			var seconds = (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds());

			this._lastChanges.push("Zmenen " + file + " - " + date.getHours() + ":" + minutes + ":" + seconds); //@ todo
			this._log.clear();
			this._printWatchedFiles();
			this._printLasChanges();
		}.bind(this));

	}, this);
}

LessWatchDog.prototype._printWatchedFiles = function(){
	this.compile();
	this._log.print("Sleduju: \n\n");
	this._watchedFiles.forEach(function(file){
		this._log.print(file , "info");
	}, this);
}

LessWatchDog.prototype._printLasChanges = function(){
	this._log.print("\nPosledni zmeny: \n\n");

	this._lastChanges.forEach(function(message){
		this._log.print(message , "success");
	}, this);
}

LessWatchDog.prototype.compile = function(){
	exec("lessc " + this._file + " " + this._file.replace(".less", ".css"), function(err, stdout, stderr){
		if (err) { console.log(err); };
		if (stderr) { console.log(stderr);};

		sys.puts(stdout);
	}.bind(this));
}

var Log = function(){
	this.clear();
}

Log.prototype.help = function(){
	console.log("");
}

/**
 * @todo  barvy podle typu
 * @param  {String} message
 * @param  {String} type    success, error, info
 */
Log.prototype.print = function(message, type){
	switch(type){
		case "success":
			console.log(message.green);
			break;
		case "info":
			console.log(message.cyan);
			break;
		case "error":
			console.log(message.red);
			break;
		default:
			console.log(message);
	}
}

Log.prototype.clear = function(){
	console.log('\033[2J');
}

var log = new Log();
var lessWatchDog = new LessWatchDog(process.argv[2], log);
