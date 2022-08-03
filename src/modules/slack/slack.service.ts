import { Injectable, Redirect, Req } from '@nestjs/common';
import { ConfigService } from 'src/shared/config.service';
import { WebClient, WebAPICallResult, ErrorCode } from '@slack/web-api';
import { RollbarHandler } from 'nestjs-rollbar';
import axios from "axios";

@Injectable()
export class SlackService {
    private _clientId: string;
    private _clientSecret: string;
    private _webClient: WebClient;

    constructor(private _configService: ConfigService) {
        this._webClient = new WebClient();
        this._clientId = this._configService.get('SLACK_CLIENT_ID');
        this._clientSecret = this._configService.get('SLACK_CLIENT_SECRET');
    }

    @RollbarHandler()
    async oauthAccess(
        code: string,
        redirectUri: string,
    ): Promise<WebAPICallResult> {
        const data = {
            code: code,
            client_id: this._clientId,
            client_secret: this._clientSecret,
            redirect_uri: redirectUri,
        };
        let response;
        try {
            response = await this._webClient.oauth.v2.access(data);
        } catch (error) {
            if (error.code === ErrorCode.PlatformError) {
                response = error.data;
            } else {
                throw new Error(error);
            }
        }

        return response;
    }

    initSlackCommand(boltApp: any): void {
        boltApp.command('/hello', async ({ command, ack, respond }) => {
            await ack();
            await respond("Hello World");
        });

        boltApp.command('/repo', async ({ command, ack, respond }) => {
            await ack();
            const commandArray = command.text.split(" ");
            if (commandArray[0] == "connect")
                await respond(`Click to login: https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENTID}&scope=user:email&scope=repo`);
            else if (commandArray[0] == "create") {
                if(process.env.GITHUB_ACCESS_TOKEN == ''){
                    await respond('Login First')
                }
                var accessToken = process.env.GITHUB_ACCESS_TOKEN;
                const data = await axios.post(`https://api.github.com/user/repos`,
                        {
                            name: commandArray[1],
                            description: "New Repo",
                            private: false,
                        },
                        {
                            headers: {
                                Accept: "application/vnd.github+json",
                                Authorization: `token ${accessToken}`,
                            },
                        }
                    )
                await respond(`Repositry created at: ${data.data.html_url}`)
            }
            else
                await respond("Command does not exist");
        });
    }
}
