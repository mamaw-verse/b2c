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
use App\Http\Controllers\ShopDirectoryController;
use App\Http\Controllers\ShopFollowController;
use App\Http\Controllers\WhyChooseUsController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('search', [SearchController::class, 'index'])->name('search');
Route::get('categories/{category:slug}', [CategoryController::class, 'show'])->name('categories.show');
Route::get('products/{product:slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('shops/{shop:slug}', [ShopController::class, 'show'])->name('shops.show');
Route::get('sellers', ShopDirectoryController::class)->name('shops.index');
Route::get('why-choose-us', WhyChooseUsController::class)->name('why-choose-us');
Route::get('pages/{page}', [App\Http\Controllers\ContentPageController::class, 'show'])->name('pages.show');
Route::get('seller/terms', App\Http\Controllers\Seller\SellerTermsController::class)->name('seller.terms');

Route::prefix('api/psgc')->name('psgc.')->group(function () {
    Route::get('regions', PsgcRegionController::class)->name('regions');
    Route::get('regions/{region}/provinces', PsgcProvinceController::class)->name('provinces');
    Route::get('provinces/{province}/cities', PsgcCityController::class)->name('cities');
    Route::get('cities/{city}/barangays', PsgcBarangayController::class)->name('barangays');
});

Route::middleware(['auth', 'verified', App\Http\Middleware\RememberWorkspace::class])->group(function () {
    Route::redirect('dashboard', '/account', 301)->name('dashboard');

    Route::resource('cart', CartController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('cart.vouchers', CartVoucherController::class)->only(['store', 'destroy']);
    Route::put('cart-selection', [CartSelectionController::class, 'update'])->name('cart.selection.update');

    Route::get('checkout', [CheckoutController::class, 'show'])->name('checkout.show');
    Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::get('order-confirmed/{order}', App\Http\Controllers\Account\OrderConfirmationController::class)->name('order-confirmed');

    Route::redirect('chat', '/account/chat', 301);
    Route::redirect('chat/{conversation}', '/account/chat/{conversation}', 301);
    Route::redirect('notifications', '/account/notifications', 301);

    Route::post('reports', [App\Http\Controllers\Report\ReportController::class, 'store'])->name('reports.store');

    Route::post('account/addresses', [AddressController::class, 'store'])->name('addresses.store');

    // Buyer workspace surfaces. Buyer and seller pages are stripped for
    // admins — their only surfaces are the admin console and settings.
    Route::middleware('workspace:buyer')->group(function () {
        Route::inertia('account', 'account/home')->name('account.home');

        Route::resource('account/addresses', AddressController::class)->only(['index', 'update', 'destroy'])->names('addresses');
        Route::put('account/addresses/{address}/default', [AddressDefaultController::class, 'update'])->name('addresses.default.update');

        Route::resource('account/orders', OrderController::class)->only(['index', 'show'])->names('orders');
        Route::post('account/orders/{order}/cancel', [OrderCancellationController::class, 'store'])->name('orders.cancel');
        Route::put('account/orders/{order}/received', [OrderReceivedController::class, 'update'])->name('orders.received');
        Route::post('account/orders/{order}/return', [OrderReturnController::class, 'store'])->name('orders.return');
        Route::resource('account/order-items/{orderItem}/reviews', ReviewController::class)->only(['create', 'store'])->names('reviews');

        Route::resource('account/chat', App\Http\Controllers\Chat\ConversationController::class)->parameters(['chat' => 'conversation'])->only(['index', 'store', 'show'])->names('chat');
        Route::post('account/chat/{conversation}/messages', [App\Http\Controllers\Chat\MessageController::class, 'store'])->name('chat.messages.store');
        Route::post('account/chat/{conversation}/read', [App\Http\Controllers\Chat\ConversationReadController::class, 'store'])->name('chat.read.store');

        Route::get('account/notifications', [App\Http\Controllers\Notification\NotificationController::class, 'index'])->name('notifications.index');
        Route::post('notifications/read', [App\Http\Controllers\Notification\NotificationReadController::class, 'store'])->name('notifications.read.store');

        Route::post('shops/{shop:slug}/follow', [ShopFollowController::class, 'store'])->name('shops.follow.store');
        Route::delete('shops/{shop:slug}/follow', [ShopFollowController::class, 'destroy'])->name('shops.follow.destroy');

        // The seller application flow is a buyer-area surface too.
        Route::get('seller/register', [App\Http\Controllers\Seller\ShopRegistrationController::class, 'create'])->name('seller.register');
        Route::post('seller/register', [App\Http\Controllers\Seller\ShopRegistrationController::class, 'store'])->name('seller.register.store');
        Route::get('seller/suspended', App\Http\Controllers\Seller\SuspendedShopController::class)->name('seller.suspended');
    });

    Route::prefix('seller')->name('seller.')->middleware('workspace:seller')->group(function () {
        Route::get('dashboard', App\Http\Controllers\Seller\DashboardController::class)->name('dashboard');
        Route::resource('products', App\Http\Controllers\Seller\ProductController::class)->names('products');
        Route::resource('orders', App\Http\Controllers\Seller\OrderController::class)->only(['index', 'show'])->names('orders');
        Route::post('orders/{order}/return', [App\Http\Controllers\Seller\OrderReturnController::class, 'store'])->name('orders.return.store');
        Route::post('orders/{order}/chat', [App\Http\Controllers\Seller\OrderChatController::class, 'store'])->name('orders.chat.store');
        Route::resource('orders.fulfillments', App\Http\Controllers\Seller\FulfillmentController::class)->only(['store', 'update'])->names('orders.fulfillments');
        Route::get('customers', [App\Http\Controllers\Seller\CustomerController::class, 'index'])->name('customers.index');
        Route::get('customers/{customer}', [App\Http\Controllers\Seller\CustomerController::class, 'show'])->name('customers.show');
        Route::get('finance', [App\Http\Controllers\Seller\FinanceController::class, 'index'])->name('finance.index');
        Route::resource('vouchers', App\Http\Controllers\Seller\VoucherController::class)->only(['index', 'store', 'update', 'destroy'])->names('vouchers');
        Route::post('payouts', [App\Http\Controllers\Seller\PayoutController::class, 'store'])->name('payouts.store');
        Route::put('payout-account', [App\Http\Controllers\Seller\PayoutAccountController::class, 'update'])->name('payout-account.update');
        Route::get('settings', [App\Http\Controllers\Seller\ShopSettingController::class, 'edit'])->name('settings.edit');
        Route::put('settings', [App\Http\Controllers\Seller\ShopSettingController::class, 'update'])->name('settings.update');

        Route::resource('chat', App\Http\Controllers\Chat\ConversationController::class)->parameters(['chat' => 'conversation'])->only(['index', 'show'])->names('chat');
        Route::post('chat/{conversation}/messages', [App\Http\Controllers\Chat\MessageController::class, 'store'])->name('chat.messages.store');
        Route::post('chat/{conversation}/read', [App\Http\Controllers\Chat\ConversationReadController::class, 'store'])->name('chat.read.store');
        Route::get('notifications', [App\Http\Controllers\Notification\NotificationController::class, 'index'])->name('notifications.index');
    });

    Route::prefix('admin')->name('admin.')->middleware('workspace:admin')->group(function () {
        Route::get('dashboard', App\Http\Controllers\Admin\DashboardController::class)->name('dashboard');
        Route::resource('moderation', App\Http\Controllers\Admin\ModerationQueueController::class)->parameters(['moderation' => 'moderationQueueItem'])->only(['index', 'show'])->names('moderation');
        Route::post('moderation/{moderationQueueItem}/decisions', [App\Http\Controllers\Admin\ModerationDecisionController::class, 'store'])->name('moderation.decisions.store');
        Route::resource('payouts', App\Http\Controllers\Admin\PayoutController::class)->only(['index', 'update'])->names('payouts');
        Route::post('moderation/bulk-decisions', [App\Http\Controllers\Admin\BulkModerationDecisionController::class, 'store'])->name('moderation.bulk-decisions.store');
        Route::get('audit-log', [App\Http\Controllers\Admin\AuditLogController::class, 'index'])->name('audit-log.index');
        Route::resource('categories', App\Http\Controllers\Admin\CategoryController::class)->only(['index', 'store', 'update', 'destroy'])->names('categories');
        Route::resource('vouchers', App\Http\Controllers\Admin\VoucherController::class)->only(['index', 'store', 'update', 'destroy'])->names('vouchers');
        Route::resource('users', App\Http\Controllers\Admin\UserController::class)->only(['index', 'show'])->names('users');
        Route::post('users/{user}/suspension', [App\Http\Controllers\Admin\UserSuspensionController::class, 'store'])->name('users.suspension.store');
        Route::delete('users/{user}/suspension', [App\Http\Controllers\Admin\UserSuspensionController::class, 'destroy'])->name('users.suspension.destroy');
        Route::get('settings', [App\Http\Controllers\Admin\SettingController::class, 'edit'])->name('settings.edit');
        Route::put('settings', [App\Http\Controllers\Admin\SettingController::class, 'update'])->name('settings.update');
    });
});

require __DIR__.'/settings.php';
