"""CDK app entrypoint (STUB -- cloud deploy deferred; app runs locally).

When implementing, uncomment and run from infra/cdk:
    cdk bootstrap && cdk deploy
"""
# import aws_cdk as cdk
# from carbon_clarity_stack import CarbonClarityStack
#
# app = cdk.App()
# CarbonClarityStack(app, "CarbonClarityStack",
#                    env=cdk.Environment(region="ap-southeast-1"))
# app.synth()

if __name__ == "__main__":
    print("CDK deploy is deferred for this prototype. Run locally: bash scripts/dev.sh")
