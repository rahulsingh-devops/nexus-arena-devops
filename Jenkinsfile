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

        stage('Backend Docker Build') {
            steps {
                sh 'docker build -t nexus-arena-backend:ci ./backend'
            }
        }

        stage('Frontend Docker Build') {
            steps {
                sh 'docker build -t nexus-arena-frontend:ci ./frontend'
            }
        }

        stage('Trivy Backend Scan') {
            steps {
                sh 'trivy image --severity HIGH,CRITICAL --exit-code 1 nexus-arena-backend:ci'
            }
        }

        stage('Trivy Frontend Scan') {
            steps {
                sh 'trivy image --severity HIGH,CRITICAL --exit-code 1 nexus-arena-frontend:ci'
            }
        }

        stage('Docker Check') {
            steps {
                sh 'docker --version'
                sh 'trivy --version'
            }
        }
    }
}
