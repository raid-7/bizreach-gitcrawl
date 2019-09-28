import os
import sys
import json
import numpy as np
import subprocess
from github import Github
import datetime
from config import ACCESS_TOKEN
import itertools


with open('skills.json') as file:
    skills = json.load(file)

    prefix_to_skill = dict()
    for (skill, frameworks) in skills.items():
        for (framework, prefixes) in frameworks.items():
            for prefix in prefixes:
                prefix_to_skill[prefix] = (skill, framework)

    id_to_skill = list(skills.keys())
    skill_to_id = {skill : i for (i, skill) in enumerate(id_to_skill)}


class User:
    def __init__(self, name, access_token=ACCESS_TOKEN):
        self.g = Github(access_token).get_user(name)
        self.name = name
        self.files = dict()
        self.frameworks = dict()


    def best_skills(self):
        for repo in filter(lambda rep: rep.language == 'Java', self.g.get_repos()):
            subprocess.run(['git', 'clone', f'https://github.com/{self.name}/{repo.name}'])
            for root, _, files in os.walk(repo.name):
                root += '/'
                for file in filter(lambda file: file.endswith('.java'), files):
                    filename = repo.name + root[len(repo.name) + 1:] + file
                    with open(root + file, 'rb') as f:
                        for line in f.read().split(b'\n'):
                            line = line.strip()
                            if line.startswith(b'import'):
                                import_name = line[6:].strip()[:-1]
                                for (prefix, (skill, framework)) in prefix_to_skill.items():
                                    if import_name.startswith(prefix.encode('utf-8')):
                                        if filename not in self.files:
                                            self.files[filename] = np.array([0 for _ in id_to_skill], dtype=np.float64)
                                            self.frameworks[skill] = set()

                                        self.files[filename][skill_to_id[skill]] += 1
                                        self.frameworks[skill].add(framework)
                        if filename in self.files:
                            self.files[filename] /= self.files[filename].sum()
            subprocess.run(['rm', '-rf', repo.name])

        if len(self.frameworks) == 0:
            return dict()

        weights = {name : 0 for name in self.files}
        for repo in  filter(lambda repo: repo.language == 'Java', self.g.get_repos()):
            for commit in repo.get_commits(since=datetime.datetime.now()+datetime.timedelta(days=-365*2),
                                           author=self.name):
                for file in commit.files:
                    filename = repo.name + file.filename
                    if filename in self.files:
                        weights[filename] += (commit.stats.deletions + commit.stats.additions)

        result = np.average(list(self.files.values()), axis=0, weights=list(weights.values()))
        best_ids = result.argsort()
        return {
            id_to_skill[i] : {
                'prob': result[i], 
                'frameworks': list(self.frameworks[id_to_skill[i]])
            } for i in filter(lambda i : result[i] > 0., best_ids)}


    def teammates(self):
        result = {}
        for repo in filter(lambda rep: rep.language == 'Java', self.g.get_repos()):
            for contributor in filter(lambda user: user.login != self.name, repo.get_contributors()):
                if contributor.login not in result:
                    result[contributor.login] = User(contributor.login).best_skills()

        return [{'login': login, 'info': info} for (login, info) in result.items()]


    def info(self):
        return {
            "avatar": self.g.avatar_url,
            "bio": self.g.bio,
            "name": self.g.name,
            "n_repos": len(list(self.g.get_repos())),
            "n_commits": len(list(itertools.chain(*list(map(lambda repo: repo.get_commits(author=self.name), list(self.g.get_repos()))))))    
        }


# print(User(sys.argv[1]).info())
