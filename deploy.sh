# Run tests
# (stackoverflow.com/questions/3822621/how-to-exit-if-a-command-failed)
npm run test || { echo 'Karma test failed, aborting deploy.' ; exit 1; }

# Move to gh-pages
git checkout gh-pages

# Checkout new files from master
git checkout master angular-1.4.3.js
git checkout master index.html
git checkout master script.js
git checkout master kick.wav
git checkout master snare.wav
git checkout master hat.wav

# Push to origin
git push origin gh-pages

# Return to master
git checkout master
