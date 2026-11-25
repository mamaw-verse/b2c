<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BlogPostStatus;
use App\Enums\ShopRole;
use App\Enums\ShopStaffStatus;
use App\Support\ActiveShop;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property string $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string|null $google_id
 * @property string|null $password
 * @property string $role
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $suspended_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'suspended_at', 'email_verified_at'])]
#[Hidden(['password', 'google_id', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
final class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUlids, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /** @return HasOne<Shop, $this> */
    public function shop(): HasOne
    {
        return $this->hasOne(Shop::class);
    }

    /**
     * The first active staff membership. Kept for places that only need
     * "is this person staff anywhere"; use `staffMemberships()` for the
     * full set.
     *
     * @return HasOne<ShopStaff, $this>
     */
    public function staffMembership(): HasOne
    {
        return $this->hasOne(ShopStaff::class)->where('status', ShopStaffStatus::Active->value);
    }

    /** @return HasMany<ShopStaff, $this> */
    public function staffMemberships(): HasMany
    {
        return $this->hasMany(ShopStaff::class)->where('status', ShopStaffStatus::Active->value);
    }

    public function isSeller(): bool
    {
        return $this->shop?->isApproved() ?? false;
    }

    /**
     * The shop the current request acts on: the active shop chosen in the
     * seller workspace, validated against live memberships. Every seller
     * query and authorization check must go through this, never through
     * `$user->shop`, which is only the shop the user *owns*.
     */
    public function operatedShop(): ?Shop
    {
        return resolve(ActiveShop::class)->shop($this);
    }

    /**
     * Approved shops the user operates, each with the role they hold there.
     *
     * @return Collection<int, array{shop: Shop, role: ShopRole}>
     */
    public function operatedShops(): Collection
    {
        return resolve(ActiveShop::class)->memberships($this);
    }

    /** The user's role in the active shop (null when they operate none). */
    public function activeShopRole(): ?ShopRole
    {
        return resolve(ActiveShop::class)->role($this);
    }

    public function roleIn(Shop $shop): ?ShopRole
    {
        return resolve(ActiveShop::class)->roleIn($this, $shop);
    }

    /** True when acting as staff (not owner) in the active shop. */
    public function isShopStaff(): bool
    {
        return $this->activeShopRole() === ShopRole::Staff;
    }

    /**
     * True when the user owns the *active* shop. Owner-only pages and
     * actions use this, so an account that owns one shop and manages
     * another never carries owner privileges into the managed shop.
     */
    public function ownsShop(): bool
    {
        return $this->activeShopRole() === ShopRole::Owner;
    }

    /** True when the user owns an approved shop, whichever is active. */
    public function ownsAnyShop(): bool
    {
        return $this->shop?->isApproved() ?? false;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /** Invited blog editor (docs/planning/15-blog.md §4.4). Keeps the buyer and seller workspaces. */
    public function isEditor(): bool
    {
        return $this->role === 'editor';
    }

    public function canManageBlog(): bool
    {
        return $this->isAdmin() || $this->isEditor();
    }

    /** The one place the §4.4 ownership rule lives: admins edit any post, editors only ones they created. */
    public function canEditBlogPost(BlogPost $post): bool
    {
        return $this->isAdmin() || ($this->isEditor() && $post->created_by_id === $this->getKey());
    }

    /** Admins delete any post; editors only their own drafts. */
    public function canDeleteBlogPost(BlogPost $post): bool
    {
        return $this->isAdmin()
            || ($this->canEditBlogPost($post) && $post->status === BlogPostStatus::Draft);
    }

    /** Google-only accounts are created without a password. */
    public function hasPassword(): bool
    {
        return $this->password !== null;
    }

    public function hasGoogleIdentity(): bool
    {
        return $this->google_id !== null;
    }

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    /** @return HasMany<CartItem, $this> */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /** @return HasMany<Address, $this> */
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return HasMany<Conversation, $this> */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    /** @return HasMany<Report, $this> */
    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    /** @return BelongsToMany<Shop, $this> */
    public function followedShops(): BelongsToMany
    {
        return $this->belongsToMany(Shop::class, 'shop_followers')->withTimestamps();
    }

    /** @return HasOne<AffiliateProfile, $this> */
    public function affiliateProfile(): HasOne
    {
        return $this->hasOne(AffiliateProfile::class);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }
}
