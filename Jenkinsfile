pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.prod.yml'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        // 1. 깃랩에서 최신 코드 가져오기
        stage('Checkout') {
            steps {
                checkout scm
                echo "Successfully checked out code from GitLab"
            }
        }

        // 2. 기존 컨테이너 중지 및 새 이미지로 배포
        stage('Deploy') {
            steps {
                echo "Starting Deployment..."
                withCredentials([file(credentialsId: 'almaeng-env', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                    sh "docker compose -f ${COMPOSE_FILE} up -d --build"
                }
            }
        }

        // 3. 미사용 이미지 정리
        stage('Cleanup') {
            steps {
                echo "Cleaning up old images..."
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            script {
                def commitAuthor = sh(script: "git show -s --pretty=%an", returnStdout: true).trim()
                def commitMsg = sh(script: "git show -s --pretty=%s", returnStdout: true).trim()
                def branchName = env.GIT_BRANCH ?: 'Unknown'

                def mmMessage = """✅ **[배포 성공] ${env.JOB_NAME}**
    - **작업자**: ${commitAuthor}
    - **브랜치**: ${branchName}
    - **코멘트**: ${commitMsg}
    - 🔗 [빌드 로그 확인하기](${env.BUILD_URL})"""

                mattermostSend(color: 'good', message: mmMessage)
            }
        }
        failure {
            script {
                def commitAuthor = sh(script: "git show -s --pretty=%an", returnStdout: true).trim()
                def commitMsg = sh(script: "git show -s --pretty=%s", returnStdout: true).trim()
                def branchName = env.GIT_BRANCH ?: 'Unknown'

                def mmMessage = """🚨 **[배포 실패] ${env.JOB_NAME}**
    - **작업자**: ${commitAuthor}
    - **브랜치**: ${branchName}
    - **코멘트**: ${commitMsg}
    - ⚠️ **빨리 확인해 주세요!**
    - 🔗 [에러 로그 확인하기](${env.BUILD_URL})"""

                mattermostSend(color: 'danger', message: mmMessage)
            }
        }
    }
}