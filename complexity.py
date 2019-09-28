import subprocess
import re
from collections import defaultdict
import xml.etree.ElementTree as ET
import os


PMD_DIR = './dist/pmd-bin-6.18.0'


MSG_RE = re.compile(r'.*complexity of (?P<value>\d+).*')


MAX_NARGS = 128


def relativize(root, path):
    root = root.rstrip('/')
    if not path.startswith(f'{root}/'):
        return path
    return path[len(root):].lstrip('/')


def get_touched_files(repo_root, commits):
    result = set()
    while commits:
        argv = ['git', '-C', repo_root, 'show',
                '--no-merges', '--name-only', '--pretty=format:', *commits[:MAX_NARGS]]
        commits = commits[MAX_NARGS:]

        with subprocess.Popen(argv, stdout=subprocess.PIPE) as proc:
            for line in proc.stdout:
                path = line.rstrip()
                if path:
                    result.add(path.decode())

    return result


def calculate(repo_root, only_files=None):
    repo_root = os.path.abspath(repo_root)
    proc = subprocess.run(
        [f'{PMD_DIR}/bin/run.sh', 'pmd', '-d', repo_root, '-f', 'xml', '-R', 'pmd_ruleset.xml'],
        stdout=subprocess.PIPE)
    root = ET.fromstring(proc.stdout)
    result = {}
    for file_elem in root.findall('{http://pmd.sourceforge.net/report/2.0.0}file'):
        path = relativize(root=repo_root, path=file_elem.attrib['name'])
        if (only_files is not None) and (path not in only_files):
            continue
        cur_result = defaultdict(dict)
        for violation_elem in file_elem.findall('{http://pmd.sourceforge.net/report/2.0.0}violation'):
            if violation_elem.get('rule') != 'CyclomaticComplexity':
                continue
            if violation_elem.get('ruleset') != 'Design':
                continue
            class_name = violation_elem.get('class')
            if class_name is None:
                continue
            method_name = violation_elem.get('method')
            m = re.match(MSG_RE, violation_elem.text.strip())
            value = int(m.group('value'))
            if method_name is None:
                cur_result[class_name]['~proper~'] = value
            else:
                cur_result[class_name][method_name] = value
        result[path] = cur_result
    return result


def calculate_filtered(repo_root, commits):
    touched_files = get_touched_files(repo_root, commits)
    return calculate(repo_root, touched_files)
