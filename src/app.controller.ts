import { Controller, Get, Res, Req, HttpStatus } from '@nestjs/common';
import axios from "axios";
import { AppService } from './app.service';

var accessToken;

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) { }

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@Get('/auth')
	async getUser(@Req() req, @Res() res) {
		const code = req.query.code;
		var token;
		const tokenData = await axios.post(`https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENTID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`)
		token = tokenData.data
		process.env.GITHUB_ACCESS_TOKEN = token.slice(13).split('&')[0];
		res.redirect("https://app.slack.com/client");
	}

	@Get('/exception')
	getException(): string {
		return this.appService.getException();
	}
}
