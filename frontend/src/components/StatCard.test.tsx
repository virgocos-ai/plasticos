import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';
import { DollarSign } from 'lucide-react';

describe('StatCard', () => {
  it('renderiza el título y valor', () => {
    render(<StatCard title="Ventas" value="$10,000" icon={DollarSign} color="green" />);
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('$10,000')).toBeInTheDocument();
  });
});
