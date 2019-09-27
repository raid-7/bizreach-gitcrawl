from github import Github
import sys


class Repo:
    pass


def get_github():
    with open("credentials.txt", "rt") as f:
        cred = f.read().strip()
    return Github(cred)

def crawl_user(username):
    gh = get_github()
    user = gh.get_user(username)
    repos = user.get_repos("all")
    for r in repos:
        print(r)

crawl_user(sys.argv[1])
