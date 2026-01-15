<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DebugCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'debug:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test debug command';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("laravel is: " . gettype($this->laravel));
        $this->info("laravel is null: " . (is_null($this->laravel) ? 'YES' : 'NO'));
        
        if ($this->laravel) {
            $this->info("env key: " . (isset($this->laravel['env']) ? 'EXISTS' : 'NOT FOUND'));
        }
    }
}
