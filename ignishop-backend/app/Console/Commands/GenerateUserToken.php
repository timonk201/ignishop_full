<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class GenerateUserToken extends Command
{
    protected $signature = 'user:generate-token {email}';
    protected $description = 'Generate an API token for a user by email';

    public function handle()
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email $email not found.");
            return 1;
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $this->info("Token for $email: $token");
        return 0;
    }
}
