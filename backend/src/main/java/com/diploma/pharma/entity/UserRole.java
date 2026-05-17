package com.diploma.pharma.entity;

/**
 * Off-chain user roles.  Maps to JWT authority {@code ROLE_<NAME>} via
 * {@link com.diploma.pharma.security.JwtAuthenticationFilter}.
 *
 * <p>Authority hierarchy:</p>
 * <ul>
 *   <li>{@link #ADMIN} — manages users/organizations; can create privileged accounts</li>
 *   <li>{@link #REGULATOR} — recall/unrecall, audit/analytics read</li>
 *   <li>{@link #MANUFACTURER} / {@link #DISTRIBUTOR} / {@link #PHARMACY} — supply-chain actors</li>
 *   <li>{@link #CONSUMER} — read-only public verification; the only role anonymous
 *       self-registration may assign</li>
 * </ul>
 */
public enum UserRole {
    ADMIN,
    MANUFACTURER,
    DISTRIBUTOR,
    PHARMACY,
    REGULATOR,
    CONSUMER
}
