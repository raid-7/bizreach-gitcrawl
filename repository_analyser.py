import os
import sys
import json
import subprocess
from github import Github, GithubException
from config import ACCESS_TOKEN
import itertools
from complexity import calculate_filtered
from collections import defaultdict


def clone_repo(user, repo, shallow):
    cache_dir = 'cache/shallow' if shallow else 'cache/full'
    clone_args = ['--depth=1', '--single-branch'] if shallow else []

    user_dir = f'{cache_dir}/{user}'
    os.makedirs(user_dir, exist_ok=True)
    result = f'{user_dir}/{repo}'
    if os.path.exists(result):
        subprocess.run(['git', '-C', result, 'fetch'], check=True)
    else:
        subprocess.run(
            ['git', 'clone', *clone_args, f'https://github.com/{user}/{repo}', result],
            check=True)
    return result


with open('skills.json') as file:
    skills = json.load(file)

    prefix_to_framework = dict()
    framework_to_skill = dict()

    for (skill, frameworks) in skills.items():
        for (framework, prefixes) in frameworks.items():
            for prefix in prefixes:
                prefix_to_framework[prefix] = framework
                framework_to_skill[framework] = skill

    # framework_to_skill["Library developer"] = "Library developer"
    id_to_framework = list(framework_to_skill.keys())
    framework_to_id = {framework : i for (i, framework) in enumerate(id_to_framework)}


def np_zeros(n):
    return [0 for _ in range(n)]

def np_normalize_inplace(xs):
    s = sum(xs)
    for i in range(len(xs)):
        xs[i] /= s

def np_average(xss, weights):
    n = len(xss[0])
    result = np_zeros(n)
    for xs, w in zip(xss, weights):
        for i in range(n):
            result[i] += w * xs[i]
    s = sum(weights)
    return [x / s for x in result]


class User:
    def __init__(self, name, access_token=ACCESS_TOKEN):
        self.g = Github(access_token).get_user(name)
        self.name = name
        self.files = defaultdict(lambda: np_zeros(len(id_to_framework)))
        self.repos = defaultdict(lambda: set())


    def best_skills(self):
        for repo in filter(lambda rep: rep.language == 'Java' or rep.language == 'Kotlin', self.g.get_repos()):
            repo_root = clone_repo(self.name, repo.name, shallow=True)
            for root, _, files in os.walk(repo_root):
                for file in filter(lambda file: file.endswith('.java') or file.endswith('.kt'), files):
                    filename = f'{root}/{file}'
                    with open(filename, 'rb') as f:
                        for line in f.read().split(b'\n'):
                            line = line.strip()
                            if line.startswith(b'import'):
                                import_name = line[6:].strip()[:-1]
                                for (prefix, framework) in prefix_to_framework.items():
                                    if import_name.startswith(prefix.encode('utf-8')):
                                        self.files[filename][framework_to_id[framework]] += 1
                                        self.repos[framework_to_skill[framework]].add(repo.name)

                        if filename in self.files:
                            np_normalize_inplace(self.files[filename])
        if len(self.files) == 0:
            return {
                "Other": {
                    "Other": 1.
                }
            }

        weights = {name: 0 for name in self.files}
        for repo in filter(lambda rep: rep.language == 'Java' or rep.language == 'Kotlin', self.g.get_repos()):
            try:
                for commit in repo.get_commits(author=self.name):
                    for file in commit.files:
                        filename = f'cache/shallow/{self.name}/{repo.name}/{file.filename}'
                        if filename in self.files:
                            weights[filename] += (commit.stats.deletions + commit.stats.additions)
            except GithubException:
                pass

        try:
            result = np_average(list(self.files.values()), weights=list(weights.values()))
        except ZeroDivisionError:
            return {
                "Other": {
                    "Other": 1.
                }
            }

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

    def try_get_commits(self, repo):
        print('TGC', repo)
        try:
            return list(repo.get_commits(author=self.name))
        except GithubException:
            return []

    def info(self):
        repos = list(self.g.get_repos())
        return {
            "avatar": self.g.avatar_url,
            "bio": self.g.bio,
            "name": self.g.name,
            "n_repos": len(repos),
            "n_commits": len(list(itertools.chain(*list(map(lambda repo: self.try_get_commits(repo), repos)))))    
        }


    def get_all_commits(self, repo_name):
        return list(map(lambda commit: commit.sha, self.g.get_repo(repo_name).get_commits(author=self.name)))


    def get_repo_complexities(self, repo_name):
        repo_root = clone_repo(self.name, repo_name, shallow=False)
        return calculate_filtered(repo_root, self.get_all_commits(repo_name))



# print(User(sys.argv[1]).get_all_commits(sys.argv[2]))
