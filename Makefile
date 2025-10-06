.PHONY: build package-qa deploy-qa qa package-prod deploy-prod prod

S3_BUCKET_QA=ahocultural-sam-artifacts-qa
S3_BUCKET_PROD=ahocultural-sam-artifacts-prod
STACK_NAME=AhoCultural-Base
REGION=us-east-1

build:
	sam build

package-qa:
	sam package --output-template-file deployment.yaml --s3-bucket $(S3_BUCKET_QA) --profile AHO

deploy-qa:
	sam deploy --template-file deployment.yaml --region $(REGION) --capabilities CAPABILITY_IAM --stack-name $(STACK_NAME)-Qa --parameter-overrides Environment=qa CertificateId=5e2747a1-0df5-46db-8ec4-3b215ae4f673 --profile AHO

qa: build package-qa deploy-qa

package-prod:
	sam package --output-template-file deployment.yaml --s3-bucket $(S3_BUCKET_PROD) --profile AHO

deploy-prod:
	sam deploy --template-file deployment.yaml --region $(REGION) --capabilities CAPABILITY_IAM --stack-name $(STACK_NAME)-Prod --parameter-overrides Environment=prod CertificateId=6b2ba522-28bf-4367-ba08-21ca90c69aa0 --profile AHO

prod: build package-prod deploy-prod