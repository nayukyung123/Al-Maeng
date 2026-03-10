pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.prod.yml'
    }

    stages {
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
                sh "docker compose -f ${COMPOSE_FILE} up -d --build"
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
            // 성공 시 MM 알림
            mattermostSend (color: 'good', message: "✅ **빌드 성공!**\n- 프로젝트: ${env.JOB_NAME}\n- 번호: #${env.BUILD_NUMBER}\n- 확인: ${env.BUILD_URL}")
        }
        failure {
            // 실패 시 MM 알림
            mattermostSend (color: 'danger', message: "🚨 **빌드 실패!**\n- 프로젝트: ${env.JOB_NAME}\n- 번호: #${env.BUILD_NUMBER}\n- 확인: ${env.BUILD_URL}")
        }
    }
}