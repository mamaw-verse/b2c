import { Form } from '@inertiajs/react';
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import PasswordInput from '@/components/password-input';
import { Banner } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);

    return (
        <section className="space-y-6">
            <Heading
                variant="small"
                title="Delete account"
                description="Delete your account and all of its resources"
            />
            <Banner tone="danger" title="Warning">
                Please proceed with caution. This cannot be undone.
                <div className="mt-3">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="danger"
                                data-test="delete-user-button"
                            >
                                Delete account
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>
                                Are you sure you want to delete your account?
                            </DialogTitle>
                            <DialogDescription className="px-5 pt-2">
                                Once your account is deleted, all of its
                                resources and data will also be permanently
                                deleted. Enter your password to confirm.
                            </DialogDescription>

                            <Form
                                {...ProfileController.destroy.form()}
                                options={{ preserveScroll: true }}
                                onError={() => passwordInput.current?.focus()}
                                resetOnSuccess
                                className="grid gap-5 px-5 py-5"
                            >
                                {({
                                    resetAndClearErrors,
                                    processing,
                                    errors,
                                }) => (
                                    <>
                                        <FormField
                                            id="delete-password"
                                            label="Password"
                                            required
                                            error={errors.password}
                                            hideLabel
                                        >
                                            <PasswordInput
                                                name="password"
                                                ref={passwordInput}
                                                placeholder="Password"
                                                autoComplete="current-password"
                                                autoFocus
                                            />
                                        </FormField>

                                        <DialogFooter className="px-0 pb-0">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="neutral"
                                                    onClick={() =>
                                                        resetAndClearErrors()
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                variant="danger"
                                                loading={processing}
                                                data-test="confirm-delete-user-button"
                                            >
                                                Delete account
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </Banner>
        </section>
    );
}
