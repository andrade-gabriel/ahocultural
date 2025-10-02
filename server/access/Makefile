.PHONY: build package-qa deploy-qa qa package-prod deploy-prod prod

S3_BUCKET_QA=ahocultural-sam-artifacts-qa
S3_BUCKET_PROD=ahocultural-sam-artifacts-prod
STACK_NAME=AhoCultural-Access
REGION=us-east-1
TSCONFIG:=../tsconfig.json

ts:
	npm install
	npx esbuild ./register/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/register/app.js

	npx esbuild ./authentication/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/authentication/app.js

	npx esbuild ./authorization/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/authorization/app.js

build: ts
	sam build

package-qa:
	sam package --output-template-file deployment.yaml --s3-bucket $(S3_BUCKET_QA) --profile AHO

deploy-qa:
	sam deploy --template-file deployment.yaml --region $(REGION) --capabilities CAPABILITY_IAM --stack-name $(STACK_NAME)-Qa --parameter-overrides Environment=qa --profile AHO

qa: build package-qa deploy-qa

package-prod:
	sam package --output-template-file deployment.yaml --s3-bucket $(S3_BUCKET_PROD) --profile AHO

deploy-prod:
	sam deploy --template-file deployment.yaml --region $(REGION) --capabilities CAPABILITY_IAM --stack-name $(STACK_NAME)-Prod --parameter-overrides Environment=prod --profile AHO

prod: build package-prod deploy-prod
