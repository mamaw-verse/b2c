<?php

declare(strict_types=1);

use App\Http\Controllers\Account\AddressController;
use App\Http\Controllers\Account\AddressDefaultController;
use App\Http\Controllers\Account\OrderCancellationController;
use App\Http\Controllers\Account\OrderController;
use App\Http\Controllers\Account\OrderReceivedController;
use App\Http\Controllers\Account\OrderReturnController;
use App\Http\Controllers\Account\ReviewController;
use App\Http\Controllers\Api\PsgcBarangayController;
use App\Http\Controllers\Api\PsgcCityController;
use App\Http\Controllers\Api\PsgcProvinceController;
use App\Http\Controllers\Api\PsgcRegionController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CartSelectionController;
use App\Http\Controllers\CartVoucherController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('search', [SearchController::class, 'index'])->name('search');
Route::get('categories/{category:slug}', [CategoryController::class, 'show'])->name('categories.show');
Route::get('products/{product:slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('shops/{shop:slug}', [ShopController::class, 'show'])->name('shops.show');

Route::prefix('api/psgc')->name('psgc.')->group(function () {
    Route::get('regions', PsgcRegionController::class)->name('regions');
    Route::get('regions/{region}/provinces', PsgcProvinceController::class)->name('provinces');
    Route::get('provinces/{province}/cities', PsgcCityController::class)->name('cities');
    Route::get('cities/{city}/barangays', PsgcBarangayController::class)->name('barangays');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::resource('cart', CartController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('cart.vouchers', CartVoucherController::class)->only(['store', 'destroy']);
    Route::put('cart-selection', [CartSelectionController::class, 'update'])->name('cart.selection.update');

    Route::get('checkout', [CheckoutController::class, 'show'])->name('checkout.show');
    Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::get('order-confirmed/{order}', App\Http\Controllers\Account\OrderConfirmationController::class)->name('order-confirmed');

    Route::resource('account/addresses', AddressController::class)->only(['index', 'store', 'update', 'destroy'])->names('addresses');
    Route::put('account/addresses/{address}/default', [AddressDefaultController::class, 'update'])->name('addresses.default.update');

    Route::resource('account/orders', OrderController::class)->only(['index', 'show'])->names('orders');
    Route::post('account/orders/{order}/cancel', [OrderCancellationController::class, 'store'])->name('orders.cancel');
    Route::put('account/orders/{order}/received', [OrderReceivedController::class, 'update'])->name('orders.received');
    Route::post('account/orders/{order}/return', [OrderReturnController::class, 'store'])->name('orders.return');
    Route::resource('account/order-items/{orderItem}/reviews', ReviewController::class)->only(['create', 'store'])->names('reviews');

    Route::resource('chat', App\Http\Controllers\Chat\ConversationController::class)->parameters(['chat' => 'conversation'])->only(['index', 'store', 'show'])->names('chat');
    Route::post('chat/{conversation}/messages', [App\Http\Controllers\Chat\MessageController::class, 'store'])->name('chat.messages.store');
    Route::post('chat/{conversation}/read', [App\Http\Controllers\Chat\ConversationReadController::class, 'store'])->name('chat.read.store');

    Route::get('notifications', [App\Http\Controllers\Notification\NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/read', [App\Http\Controllers\Notification\NotificationReadController::class, 'store'])->name('notifications.read.store');

    Route::post('reports', [App\Http\Controllers\Report\ReportController::class, 'store'])->name('reports.store');

    Route::get('seller/register', [App\Http\Controllers\Seller\ShopRegistrationController::class, 'create'])->name('seller.register');
    Route::post('seller/register', [App\Http\Controllers\Seller\ShopRegistrationController::class, 'store'])->name('seller.register.store');

    Route::prefix('seller')->name('seller.')->group(function () {
        Route::get('dashboard', App\Http\Controllers\Seller\DashboardController::class)->name('dashboard');
        Route::resource('products', App\Http\Controllers\Seller\ProductController::class)->names('products');
        Route::resource('orders', App\Http\Controllers\Seller\OrderController::class)->only(['index', 'show'])->names('orders');
        Route::post('orders/{order}/shipment', [App\Http\Controllers\Seller\ShipmentController::class, 'store'])->name('orders.shipment.store');
        Route::get('settings', [App\Http\Controllers\Seller\ShopSettingController::class, 'edit'])->name('settings.edit');
        Route::put('settings', [App\Http\Controllers\Seller\ShopSettingController::class, 'update'])->name('settings.update');
    });

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('dashboard', App\Http\Controllers\Admin\DashboardController::class)->name('dashboard');
        Route::resource('moderation', App\Http\Controllers\Admin\ModerationQueueController::class)->parameters(['moderation' => 'moderationQueueItem'])->only(['index', 'show'])->names('moderation');
        Route::post('moderation/{moderationQueueItem}/decisions', [App\Http\Controllers\Admin\ModerationDecisionController::class, 'store'])->name('moderation.decisions.store');
        Route::post('moderation/bulk-decisions', [App\Http\Controllers\Admin\BulkModerationDecisionController::class, 'store'])->name('moderation.bulk-decisions.store');
    });
});

require __DIR__.'/settings.php';
