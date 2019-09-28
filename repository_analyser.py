import os
import sys
import json
import numpy as np
import subprocess
from github import Github
import datetime
from config import ACCESS_TOKEN
import itertools
from collections import defaultdict


with open('skills.json') as file:
    skills = json.load(file)

    prefix_to_framework = dict()
    framework_to_skill = dict()

    for (skill, frameworks) in skills.items():
        for (framework, prefixes) in frameworks.items():
            for prefix in prefixes:
                prefix_to_framework[prefix] = framework
                framework_to_skill[framework] = skill

    framework_to_skill["Library developer"] = "Library developer"
    id_to_framework = list(framework_to_skill.keys())
    framework_to_id = {framework : i for (i, framework) in enumerate(id_to_framework)}


class User:
    def __init__(self, name, access_token=ACCESS_TOKEN):
        self.g = Github(access_token).get_user(name)
        self.name = name
        self.files = defaultdict(lambda: np.zeros(len(id_to_framework)))
        self.repos = defaultdict(lambda: set())


    def best_skills(self):
        for repo in filter(lambda rep: rep.language == 'Java' or rep.language == 'Kotlin', self.g.get_repos()):
            subprocess.run(['mkdir', '-p', 'cache'])
            subprocess.run(['git', 'clone', '--depth', '1', '--single-branch', f'https://github.com/{self.name}/{repo.name}', f'./cache/{repo.name}'])
            for root, _, files in os.walk(repo.name):
                root += '/'
                for file in filter(lambda file: file.endswith('.java') or file.endswith('.kt'), files):
                    filename = repo.name + root[len(repo.name) + 1:] + file
                    with open(root + file, 'rb') as f:
                        for line in f.read().split(b'\n'):
                            line = line.strip()
                            if line.startswith(b'import'):
                                import_name = line[6:].strip()[:-1]
                                for (prefix, framework) in prefix_to_framework.items():
                                    if import_name.startswith(prefix.encode('utf-8')):
                                        self.files[filename][framework_to_id[framework]] += 1
                                        self.repos[framework_to_skill[framework]].add(repo.name)

                        if filename in self.files:
                            self.files[filename] /= self.files[filename].sum()
                        else:
                            self.files[filename][-1] = 1.
                            self.repos["Library developer"].add(repo.name)

        if len(self.files) == 0:
            return dict()

        weights = {name : 0 for name in self.files}
        for repo in filter(lambda rep: rep.language == 'Java' or rep.language == 'Kotlin', self.g.get_repos()):
            for commit in repo.get_commits(author=self.name):
                for file in commit.files:
                    filename = repo.name + file.filename
                    if filename in self.files:
                        weights[filename] += (commit.stats.deletions + commit.stats.additions)

        try:
            result = np.average(list(self.files.values()), axis=0, weights=list(weights.values()))
        except ZeroDivisionError:
            return dict()
        
        ans = defaultdict(lambda: defaultdict(lambda: 0.))
        for i, val in enumerate(result):
            skill = framework_to_skill[id_to_framework[i]]
            if val > 0:
                ans[skill][id_to_framework[i]] = val
                ans[skill]["repos"] = list(self.repos[skill])

        return ans


    def teammates(self):
        result = {}
        for repo in filter(lambda rep: rep.language == 'Java' or rep.language == 'Kotlin', self.g.get_repos()):
            for contributor in filter(lambda user: user.login != self.name, repo.get_contributors()):
                if contributor.login not in result:
                    result[contributor.login] = User(contributor.login).best_skills()

        return [{'login': login, 'info': info} for (login, info) in result.items() if len(info) > 0]


    def info(self):
        return {
            "avatar": self.g.avatar_url,
            "bio": self.g.bio,
            "name": self.g.name,
            "n_repos": len(list(self.g.get_repos())),
            "n_commits": len(list(itertools.chain(*list(map(lambda repo: repo.get_commits(author=self.name), list(self.g.get_repos()))))))    
        }

    def get_all_commits(self, repo_name):
        return list(map(lambda commit: commit.sha, self.g.get_repo(repo_name).get_commits(author=self.name)))


# print(User(sys.argv[1]).get_all_commits(sys.argv[2]))
