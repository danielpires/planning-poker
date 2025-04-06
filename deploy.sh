function build {
    npm install
    # npm run prettier:check
    # npm run test
    # npm run test:acceptance
    npm run build
}

function zipLocally {
    zip -r planning_poker.zip node_modules/ package.json planning_poker.service dist/ public/
}

function upload {
    scp planning_poker.zip $1@$2:/home/pi/planning_poker/planning_poker.zip
}

function unzipOnServer {
    ssh $1@$2 "cd /home/pi/planning_poker && unzip -o planning_poker.zip"
}

function deleteZipOnServer {
    ssh $1@$2 "rm /home/pi/planning_poker/planning_poker.zip"
}

function restartService {
    ssh $1@$2 "sudo systemctl restart planning_poker"
}

function deploy {
    build
    zipLocally
    upload $1 $2
    unzipOnServer $1 $2
    deleteZipOnServer $1 $2
    restartService $1 $2
}

deploy $1 $2