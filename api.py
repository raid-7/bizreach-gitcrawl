from flask import Flask, request, jsonify, redirect
from repository_analyser import User


app = Flask(__name__,
            static_url_path='', 
            static_folder='web')
app.config["DEBUG"] = True



@app.route('/', methods=['GET'])
def start():
    return redirect('/index.html')
    

@app.route('/best_skills', methods=['GET'])
def best_skills():
    if 'user' in request.args:
        print()
        return jsonify(User(request.args['user']).best_skills())
    else:
        return "Error: <user> arg is not provided"


@app.route('/teammates', methods=['GET'])
def teammates():
    if 'user' in request.args:
        return jsonify(User(request.args['user']).teammates())
    else:
        return "Error: <user> arg is not provided"

@app.route('/info', methods=['GET'])
def info():
    if 'user' in request.args:
        return jsonify(User(request.args['user']).info())
    else:
        return "Error: <user> arg is not provided"


app.run()
