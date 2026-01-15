<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Encryption\Encrypter;

class TestKeyCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:key';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test key command like framework';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $key = $this->generateRandomKey();
        $this->info("Generated key: $key");
    }

    protected function generateRandomKey()
    {
        return 'base64:'.base64_encode(
            Encrypter::generateKey($this->laravel['config']['app.cipher'])
        );
    }
}
