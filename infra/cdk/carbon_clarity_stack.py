"""CarbonClarity infrastructure stack (STUB).

Cloud deploy is intentionally DEFERRED for this prototype -- the app runs fully
locally (FastAPI + Vite). This stub documents the intended serverless topology
so it can be completed later without rearchitecting: the four handlers in
backend/handlers/ are already plain functions ready to wrap as Lambdas.

Intended resources (not yet provisioned):
  * 4x Lambda (Python 3.12): calculate, portfolio, scenario, summary
  * 1x API Gateway HTTP API with routes /calculate /portfolio /scenario /summary
  * IAM: bedrock:InvokeModelWithResponseStream on the chosen Claude model
  * data/ bundled in the Lambda zip (buildings.json, factors.json, etc.)

To implement, install aws-cdk-lib and uncomment the body below.
"""
from __future__ import annotations

# from aws_cdk import (
#     Stack, Duration, CfnOutput,
#     aws_lambda as _lambda,
#     aws_apigatewayv2 as apigw,
#     aws_apigatewayv2_integrations as integrations,
#     aws_iam as iam,
# )
# from constructs import Construct
#
#
# class CarbonClarityStack(Stack):
#     def __init__(self, scope: Construct, cid: str, **kw) -> None:
#         super().__init__(scope, cid, **kw)
#         common = dict(runtime=_lambda.Runtime.PYTHON_3_12,
#                       code=_lambda.Code.from_asset("../../backend"),
#                       timeout=Duration.seconds(30), memory_size=256)
#         fns = {name: _lambda.Function(self, name.title(),
#                   handler=f"lambda_adapters.{name}_handler", **common)
#                for name in ("calculate", "portfolio", "scenario", "summary")}
#         fns["summary"].add_to_role_policy(iam.PolicyStatement(
#             actions=["bedrock:InvokeModelWithResponseStream", "bedrock:InvokeModel"],
#             resources=["*"]))
#         api = apigw.HttpApi(self, "CarbonClarityApi")
#         for name, fn in fns.items():
#             api.add_routes(path=f"/{name}", methods=[apigw.HttpMethod.ANY],
#                 integration=integrations.HttpLambdaIntegration(f"{name}Int", fn))
#         CfnOutput(self, "ApiUrl", value=api.url or "")
