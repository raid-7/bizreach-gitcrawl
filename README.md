Bizreach Gitcrawl
================

Bizreach Gitcrawl is a tool for evaluation of skills of an engineer by his Github account.

You can test it [here](http://51.15.36.48:8080).

### Things we look at to draw up a dossier of a developer:
- frameworks used
- total amount of additions/deletions
    - if a developer commits more into backend-oriented code, we give more weight to their backend skills
- cyclomatic complexity of code
    - we use [*Chidamber and Kemerer WMC metric*](https://www.win.tue.nl/~aserebre/2IS55/2012-2013/10.pdf) to estimate the quality of the code
    - in terms of visualization, the bigger the ball is, the more complex class it represents; dramatic difference between sizes is bad (complexity should be spread over the code base evenly) and shows low code quality.


#### Can I run it on my computer?

Yes. You need Python>=3.8 and Java>=11.

```sh
./download-pmd.sh # download and unpack java code analyzer
pip3 install -r requirements.txt
python api.py
# Browse at http://localhost:5000
```

Or use docker.

