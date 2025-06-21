<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable(); // Связь с пользователем (опционально)
            $table->json('items'); // Список товаров в формате JSON
            $table->decimal('total', 8, 2); // Общая сумма
            $table->string('delivery_method'); // Способ доставки
            $table->string('address')->nullable(); // Адрес (если доставка)
            $table->integer('used_bonus_points')->nullable()->default(0); // Списанные бонусы
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('orders');
    }
};
