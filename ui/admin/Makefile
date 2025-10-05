.PHONY: build package-qa deploy-qa qa package-prod deploy-prod prod

S3_BUCKET_QA=ahocultural-static-qa
S3_BUCKET_PROD=ahocultural-static-prod

build:
	tsc -b && vite build

deploy-qa:
	aws s3 sync .dist/ s3://$(S3_BUCKET_QA)/admin --delete --profile AHO

qa: build deploy-qa

deploy-prod:
	sam deploy --template-file deployment.yaml --region $(REGION) --capabilities CAPABILITY_IAM --stack-name $(STACK_NAME)-Prod --parameter-overrides Environment=prod --profile AHO

prod: build package-prod deploy-prod
