pipeline {
    agent any

    stages {


        stage('Backend Validation') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npm run typecheck'
                    sh 'npm run lint'
                    sh 'npm test'
                    sh 'npm run build'
                }
            }
        }

        stage('Frontend Validation') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run typecheck'
                    sh 'npm run lint'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Check') {
            steps {
                sh 'docker --version'
            }
        }
    }
}
