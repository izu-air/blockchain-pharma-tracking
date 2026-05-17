package com.diploma.pharma.security;

import com.diploma.pharma.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Extracts and validates a Bearer JWT from the {@code Authorization} header.
 * <p>If the header is absent, the request continues unauthenticated (downstream
 * authorization rules decide whether that's allowed).  If the header is present
 * but invalid/expired, the request is short-circuited with {@code 401} so that
 * forged or stale tokens are rejected explicitly rather than silently treated
 * as anonymous traffic.</p>
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final String BEARER_PREFIX = "Bearer ";
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || header.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }
        if (!header.startsWith(BEARER_PREFIX)) {
            unauthorized(response, "Authorization header must use Bearer scheme");
            return;
        }
        String token = header.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            unauthorized(response, "Bearer token is empty");
            return;
        }
        Optional<JwtService.ParsedJwt> parsed = jwtService.parseValidToken(token);
        if (parsed.isEmpty()) {
            unauthorized(response, "Bearer token is invalid or expired");
            return;
        }
        JwtService.ParsedJwt jwt = parsed.get();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                jwt.walletAddress(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + jwt.role().name()))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }

    private static void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"error\":\"Unauthorized\",\"message\":\"" + message.replace("\"", "'") + "\"}");
    }
}
