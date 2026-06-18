module.exports = {
  apps: [
    {
      name: 'matabbukhari-backend',
      script: 'server.js',
      instances: 'max', // Utilizes all CPU cores
      exec_mode: 'cluster', // Cluster mode
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3300,
      },
    },
  ],
};
