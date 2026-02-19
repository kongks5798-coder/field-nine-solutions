// Dummy jwt module for build
// Accepts payload, secret, and expiresIn, returns dummy token
export async function signJWT(payload: any, secret: string, expiresIn: number) {
	return 'dummy.jwt.token';
}