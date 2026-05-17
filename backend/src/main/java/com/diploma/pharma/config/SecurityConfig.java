package com.diploma.pharma.config;

import com.diploma.pharma.security.JwtAuthenticationFilter;
import com.diploma.pharma.service.JwtService;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtService jwtService,
            @Value("${app.security.require-authentication-for-mutations:true}") boolean requireAuthForMutations
    ) throws Exception {
        // CSRF disabled — this is a stateless JSON API where authentication is
        // carried in the Authorization header (never a cookie), so CSRF tokens
        // would add no protection.  If session/cookie auth is ever introduced
        // CSRF protection must be re-enabled at that point.
        http.csrf(csrf -> csrf.disable());
        http.cors(Customizer.withDefaults());
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        http.authorizeHttpRequests(auth -> {
            if (!requireAuthForMutations) {
                auth.anyRequest().permitAll();
                return;
            }
            auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    // Public auth + health endpoints
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                    // OpenAPI docs — restrict to non-prod via app.security flag if needed
                    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/swagger-ui/index.html")
                    .permitAll()
                    // Consumer-facing read endpoints (verify, history) stay public so
                    // a buyer can scan a QR without logging in.  Sensitive read
                    // endpoints (audit logs, analytics summary, raw events,
                    // user listing) require auth + role check at the
                    // controller (@PreAuthorize).
                    .requestMatchers(HttpMethod.GET, "/api/audit-logs/**").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/product-events/**").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/analytics/**").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/users").authenticated()
                    // Public consumer routes: verifyProduct, batch-metadata read,
                    // product-metadata read, organizations (listing), etc.
                    .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                    // Self-registration (POST /api/users) is intentionally public.
                    .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/**").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/**").authenticated()
                    .requestMatchers(HttpMethod.PATCH, "/api/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/**").authenticated()
                    .anyRequest().permitAll();
        });

        http.exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"JWT required for this operation\"}");
        }));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${FRONTEND_ORIGIN:http://localhost:5173}") String frontendOrigin
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendOrigin.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // Explicit allowlist (avoid wildcard which can interact badly with
        // setAllowCredentials=true under stricter browser CORS policies).
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
