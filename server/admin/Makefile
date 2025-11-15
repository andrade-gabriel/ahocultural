.PHONY: build package-qa deploy-qa qa package-prod deploy-prod prod

S3_BUCKET_QA=ahocultural-sam-artifacts-qa
S3_BUCKET_PROD=ahocultural-sam-artifacts-prod
STACK_NAME=AhoCultural-Admin
REGION=us-east-1
TSCONFIG:=../tsconfig.json

DB_PASSWORD_QA := 'aB8d3F9kLm2Pq7Rt'
DB_PASSWORD_PROD := '9yH3vZ6wQ1rT8nLp'

ts:
	npm install
	npx esbuild ./company/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/company/app.js

	npx esbuild ./category/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/category/app.js

	npx esbuild ./location/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/location/app.js

	npx esbuild ./article/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/article/app.js

# 	npx esbuild ./event/app.ts \
# 		--bundle --platform=node --target=node22 \
# 		--tsconfig=$(TSCONFIG) \
# 		--outfile=.dist/event/app.js

	npx esbuild ./file/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/file/app.js

	npx esbuild ./about/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/about/app.js

	npx esbuild ./advertisement/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/advertisement/app.js
	
	npx esbuild ./contact/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/contact/app.js

	npx esbuild ./studio/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/studio/app.js

	npx esbuild ./geo/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/geo/app.js

	npx esbuild ./ad/app.ts \
		--bundle --platform=node --target=node22 \
		--tsconfig=$(TSCONFIG) \
		--outfile=.dist/ad/app.js

build: ts
	sam build

package-qa:
	sam package --output-template-file deployment.yaml --s3-bucket $(S3_BUCKET_QA) --profile AHO

deploy-qa:
	sam deploy --template-file deployment.yaml --region $(REGION) --capabilities CAPABILITY_IAM --s3-bucket $(S3_BUCKET_QA) --stack-name $(STACK_NAME)-Qa --parameter-overrides Environment=qa DBUsername=admin DBPassword=$(DB_PASSWORD_QA) --profile AHO

qa: build package-qa deploy-qa

package-prod:
	sam package --output-template-file deployment.yaml --s3-bucket $(S3_BUCKET_PROD) --profile AHO

deploy-prod:
	sam deploy \
		--template-file deployment.yaml \
		--region $(REGION) \
		--capabilities CAPABILITY_IAM \
		--s3-bucket $(S3_BUCKET_PROD) \
		--stack-name $(STACK_NAME)-Prod \
		--parameter-overrides Environment=prod DBUsername=admin DBPassword=$(DB_PASSWORD_PROD) \
		--profile AHO

prod: build package-prod deploy-prod
