import cors from 'cors';


      // Configuration CORS
        const corsOptions = {
            origin: (origin: string | undefined, callback: Function) => {
                const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'https://vercel.app',
                    'https://*.vercel.app'
                ];

                // Permettre les requêtes sans origin (mobile apps, etc.)
                if (!origin) return callback(null, true);

                if (allowedOrigins.includes(origin) || 
                    allowedOrigins.some(allowed => origin.includes(allowed.replace('*', '')))) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'Cache-Control',
                'X-File-Name'
            ],
            optionSuccessStatus: 200
        };

 export const corsMiddleware = cors(corsOptions);
