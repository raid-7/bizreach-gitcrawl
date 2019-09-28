from flask import Flask, request, jsonify, redirect
from repository_analyser import User


application = Flask(__name__,
            static_url_path='', 
            static_folder='web')
application.config["DEBUG"] = True



@application.route('/', methods=['GET'])
def start():
    return redirect('/index.html')


@application.route('/best_skills', methods=['GET'])
def best_skills():
    if 'user' in request.args:
        print()
        return jsonify(User(request.args['user']).best_skills())
    else:
        return "Error: <user> arg is not provided"


@application.route('/teammates', methods=['GET'])
def teammates():
    if 'user' in request.args:
        return jsonify(User(request.args['user']).teammates())
    else:
        return "Error: <user> arg is not provided"

@application.route('/info', methods=['GET'])
def info():
    if 'user' in request.args:
        return jsonify(User(request.args['user']).info())
    else:
        return "Error: <user> arg is not provided"

@application.route('/complexities', methods=['GET'])
def complexities():
    if 'user' in request.args and 'repo' in request.args:
        return jsonify(User(request.args['user']).get_repo_complexities(request.args['repo']))
    else:
        return 'Error'

if __name__ == '__main__':
    application.run('0.0.0.0')
