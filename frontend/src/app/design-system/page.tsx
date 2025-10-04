'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { Search, Mail, Lock } from 'lucide-react';

export default function DesignSystemPage() {
    return (
        <div className="section-container">
            <h1 className="page-title">SynapseAI Design System</h1>
            <p style={{ fontFamily: 'var(--font-lato), Lato, sans-serif', fontSize: '16px' }} className="text-neutralGray-700 mb-12">
                Live examples of all UI components and design tokens.
            </p>

            {/* Colors */}
            <section className="mb-16">
                <h2 className="section-title">Color Palette</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <div className="h-24 bg-synapseSkyBlue rounded-card mb-2"></div>
                        <p className="text-sm font-medium">synapseSkyBlue</p>
                        <p className="text-sm text-neutralGray-700">#50B9E8</p>
                    </div>
                    <div>
                        <div className="h-24 bg-synapseDarkBlue rounded-card mb-2"></div>
                        <p className="text-sm font-medium">synapseDarkBlue</p>
                        <p className="text-sm text-neutralGray-700">#0A4D8B</p>
                    </div>
                    <div>
                        <div className="h-24 bg-successGreen rounded-card mb-2"></div>
                        <p className="text-sm font-medium">successGreen</p>
                        <p className="text-sm text-neutralGray-700">#38A169</p>
                    </div>
                    <div>
                        <div className="h-24 bg-warningRed rounded-card mb-2"></div>
                        <p className="text-sm font-medium">warningRed</p>
                        <p className="text-sm text-neutralGray-700">#E53E3E</p>
                    </div>
                </div>
            </section>

            {/* Typography */}
            <section className="mb-16">
                <h2 className="section-title">Typography</h2>
                <Card>
                    <h1 className="page-title">Page Title (H1) - 48px Poppins Bold</h1>
                    <h2 className="section-title">Section Title (H2) - 36px Poppins Bold</h2>
                    <h3 className="card-title">Card Title (H3) - 24px Poppins Semibold</h3>
                    <p style={{ fontFamily: 'var(--font-lato), Lato, sans-serif', fontSize: '16px' }}>Body Text - 16px Lato Regular with 1.5 line height</p>
                    <p style={{ fontFamily: 'var(--font-lato), Lato, sans-serif', fontSize: '14px' }} className="text-neutralGray-700">Label/Caption - 14px Lato Regular</p>
                </Card>
            </section>

            {/* Buttons */}
            <section className="mb-16">
                <h2 className="section-title">Buttons</h2>
                <div className="flex flex-wrap gap-4 mb-6">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="tertiary">Tertiary Button</Button>
                </div>
                <div className="flex flex-wrap gap-4 mb-6">
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium</Button>
                    <Button variant="primary" size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button variant="primary" disabled>Disabled Button</Button>
                    <Button variant="primary" isLoading>Loading...</Button>
                    <Button variant="primary" leftIcon={<Mail className="w-5 h-5" />}>With Icon</Button>
                </div>
            </section>

            {/* Form Fields */}
            <section className="mb-16">
                <h2 className="section-title">Form Fields</h2>
                <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
                    <Input
                        label="Default Input"
                        placeholder="Enter text..."
                    />
                    <Input
                        label="Input with Icon"
                        placeholder="Search..."
                        leftIcon={<Search className="w-5 h-5" />}
                    />
                    <Input
                        label="Input with Error"
                        error="This field is required"
                        placeholder="Enter text..."
                    />
                    <Input
                        label="Input with Success"
                        success="Looks good!"
                        placeholder="Enter text..."
                        value="Valid input"
                        readOnly
                    />
                    <Select
                        label="Select Field"
                        options={[
                            { value: 'option1', label: 'Option 1' },
                            { value: 'option2', label: 'Option 2' },
                            { value: 'option3', label: 'Option 3' },
                        ]}
                    />
                    <Input
                        label="Disabled Input"
                        disabled
                        value="Disabled"
                        readOnly
                    />
                </div>
            </section>

            {/* Cards */}
            <section className="mb-16">
                <h2 className="section-title">Cards</h2>
                <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
                    <Card>
                        <h3 className="card-title">Default Card</h3>
                        <p className="text-base text-neutralGray-700">
                            This is a default card with shadow and border. Hover to see the elevation effect.
                        </p>
                    </Card>
                    <Card variant="secondary">
                        <h3 className="card-title">Secondary Card</h3>
                        <p className="text-base text-neutralGray-700">
                            This card has a light gray background for subtle differentiation.
                        </p>
                    </Card>
                    <Card hoverable>
                        <h3 className="card-title">Hoverable Card</h3>
                        <p className="text-base text-neutralGray-700">
                            This card has enhanced hover effects and cursor pointer for interactive elements.
                        </p>
                    </Card>
                </div>
            </section>

            {/* Badges */}
            <section className="mb-16">
                <h2 className="section-title">Badges</h2>
                <div className="flex flex-wrap gap-4">
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="neutral">Neutral</Badge>
                </div>
            </section>

            {/* Spacing */}
            <section className="mb-16">
                <h2 className="section-title">8-Point Grid Spacing</h2>
                <Card>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-8 bg-synapseSkyBlue rounded"></div>
                            <span className="text-sm">8px (grid-8)</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-synapseSkyBlue rounded"></div>
                            <span className="text-sm">16px (grid-16)</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 bg-synapseSkyBlue rounded"></div>
                            <span className="text-sm">24px (grid-24)</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-32 h-32 bg-synapseSkyBlue rounded"></div>
                            <span className="text-sm">32px (grid-32)</span>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Utility Classes */}
            <section>
                <h2 className="section-title">Utility Classes</h2>
                <Card>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium mb-2">Divider</p>
                            <div className="divider"></div>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">Link Primary</p>
                            <a href="#" className="link-primary">This is a primary link</a>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">Section Container</p>
                            <code className="text-sm bg-neutralGray-100 px-2 py-1 rounded">
                                .section-container - max-w-7xl mx-auto px-6 py-12
                            </code>
                        </div>
                    </div>
                </Card>
            </section>
        </div>
    );
}
